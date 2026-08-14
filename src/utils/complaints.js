// Complaint helpers

// Query string for the paginated complaint list endpoints
export const buildComplaintsQuery = (params = {}) => {
  const { status = 'ALL', sort = 'NEWEST', page = 0, size = 10 } = params;
  return new URLSearchParams({
    status,
    sort,
    page: page.toString(),
    size: size.toString(),
  }).toString();
};

// Profile shape expected by ProfileModal, built from a complaint payload
export const studentProfileFromComplaint = (complaint) => ({
  name: complaint.studentName,
  email: complaint.studentEmail,
  regNo: complaint.studentRegNumber,
  departmentName: complaint.departmentName,
  profilePicturePath: complaint.profilePicturePath,
});

export const departmentProfileFromComplaint = (complaint) => ({
  departmentName: complaint.departmentName,
  email: complaint.departmentEmail,
  departmentProfile: complaint.departmentProfile,
});
