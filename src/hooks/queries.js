import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { departmentService } from '../services/departmentService';

/**
 * Every query and mutation in one place.
 *
 * WHY A HOOK PER CALL SITE rather than useQuery inline in each page: query keys and their
 * invalidation rules have to agree, and keys spread across eight pages drift. When sending a reply
 * needs to invalidate the complaint it changed, that coupling lives here where it can be read next
 * to the key it invalidates.
 *
 * SCOPE IN EVERY KEY: `scope` is 'student' or 'department'. Without it, a student who logs out and
 * a department that logs in on the same tab share one cache - and for up to staleTime the second
 * user would be shown the first user's complaints. Scope separates them. AuthContext additionally
 * clears the whole cache on logout, so this is defence in depth rather than the only guard.
 */

const serviceFor = (scope) => (scope === 'student' ? studentService : departmentService);

/** The list view both complaint lists open on, and the one NewComplaint navigates into. */
export const DEFAULT_LIST = { status: 'ALL', sort: 'NEWEST', page: 0, size: 10 };

export const queryKeys = {
  profile: (scope) => ['profile', scope],
  complaintList: (scope, params) => ['complaints', scope, 'list', params],
  complaintDetail: (scope, id) => ['complaints', scope, 'detail', String(id)],

  // Prefix covering every complaint query for a scope, so one invalidateQueries call refreshes the
  // detail, the list, and the dashboard's recent slice together. A new complaint can change all
  // three, and invalidating them separately is how a stale row survives a send.
  complaints: (scope) => ['complaints', scope],
};

/*  profile  */

export const useProfile = (scope) =>
  useQuery({
    queryKey: queryKeys.profile(scope),
    queryFn: () => serviceFor(scope).getProfile(),
  });

export const useUpdateProfile = (scope) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => serviceFor(scope).updateProfile(formData),

    onSuccess: (updated) => {
      // updateProfile returns the saved record, so it is written straight into the cache rather
      // than triggering a refetch. One round trip instead of two, and no loading state in between.
      queryClient.setQueryData(queryKeys.profile(scope), updated);
    },
  });
};

/*  complaints  */

export const useComplaintsList = (scope, params) =>
  useQuery({
    queryKey: queryKeys.complaintList(scope, params),
    queryFn: () => serviceFor(scope).getComplaints(params),

    // Keeps the rows already on screen while the next page or filter loads, instead of blanking
    // back to a skeleton. This is what makes paging and filtering feel instant, and it replaces
    // the hand-written useBackgroundLoad hook this replaced.
    placeholderData: keepPreviousData,

    // The list is where a user sits and waits: a student watching for a department reply to flip a
    // row from OPEN to REPLIED, a department watching for a new complaint to appear. Without this
    // the badge only changes on tab refocus, so a reply landing while the page is open looks like
    // nothing happened. 15s matches the open-detail cadence. The page is served from the Redis list
    // cache server-side (a cache hit, not Postgres), and refetchIntervalInBackground defaults to
    // false, so a hidden tab stops polling entirely. Paging/filtering still feel instant because
    // placeholderData holds the previous rows during each poll.
    refetchInterval: 15_000,
  });

export const useComplaintDetail = (scope, id) =>
  useQuery({
    queryKey: queryKeys.complaintDetail(scope, id),
    queryFn: () => serviceFor(scope).getComplaint(id),
    enabled: Boolean(id),

    // A reply from the other party has to arrive on its own while the page is open. Polling the
    // open complaint is the cheap, stateless stand-in for a WebSocket: the response is tiny, it is
    // served from the Redis cache server-side, and refetchIntervalInBackground defaults to false,
    // so a hidden tab stops polling entirely (abandoned tabs cost nothing). 15s is the cadence a
    // waiting user reads as "live" without a socket or a request storm.
    refetchInterval: 15_000,
  });

/** The dashboard's recent slice. Separate page size, so a distinct key from DEFAULT_LIST. */
export const useRecentComplaints = (scope, size) =>
  useQuery({
    queryKey: queryKeys.complaintList(scope, { status: 'ALL', sort: 'NEWEST', page: 0, size }),
    queryFn: () => serviceFor(scope).getComplaints({ status: 'ALL', sort: 'NEWEST', page: 0, size }),

    // Slower cadence than the open-detail poll (15s). A dashboard is a glance, not a live thread,
    // so 30s keeps status badges fresh without the numbers visibly jumping. refetchOnWindowFocus
    // already snaps it current the moment the user returns, so this only covers someone who sits
    // and watches. Served from the Redis list cache server-side, so the poll is cheap; and
    // refetchIntervalInBackground defaults to false, so a hidden tab stops polling entirely.
    refetchInterval: 30_000,
  });

/*  mutations  */

export const useSendComplaint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => studentService.sendComplaint(formData),

    onSuccess: async () => {
      // Warm the list before the caller navigates to it, so the new complaint is on screen on the
      // first frame instead of behind a skeleton.
      await queryClient.prefetchQuery({
        queryKey: queryKeys.complaintList('student', DEFAULT_LIST),
        queryFn: () => studentService.getComplaints(DEFAULT_LIST),
      });

      // Then mark everything complaint-shaped stale. The dashboard's recent slice has a different
      // page size and so a different key; this prefix catches it along with the detail views.
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints('student') });
    },
  });
};

export const useSendReply = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => departmentService.replyToComplaint(formData),

    onSuccess: async () => {
      // The caller navigates to this complaint's detail page immediately.
      await queryClient.prefetchQuery({
        queryKey: queryKeys.complaintDetail('department', id),
        queryFn: () => departmentService.getComplaint(id),
      });

      queryClient.invalidateQueries({ queryKey: queryKeys.complaints('department') });
    },
  });
};

export const useCloseComplaint = (id) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => departmentService.closeComplaint(id),

    // No manual reload: invalidating the scope makes the open detail query refetch itself, so the
    // status badge updates without the page touching a loading flag.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.complaints('department') });
    },
  });
};