import { useCallback, useState } from 'react';

// State for the shared ProfileModal: returns props to spread onto it
// plus an opener taking the profile and its type ('student' | 'department').
export const useProfileModal = () => {
  const [profile, setProfile] = useState(null);
  const [type, setType] = useState(null);

  const openProfile = useCallback((nextProfile, nextType) => {
    setProfile(nextProfile);
    setType(nextType);
  }, []);

  const closeProfile = useCallback(() => {
    setProfile(null);
    setType(null);
  }, []);

  return {
    openProfile,
    profileModalProps: {
      isOpen: Boolean(profile),
      profile,
      type,
      onClose: closeProfile,
    },
  };
};
