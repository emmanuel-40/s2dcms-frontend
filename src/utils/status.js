// Complaint status helpers

const STATUS_COLORS = {
  PENDING: 'bg-yellow-500',
  IN_PROGRESS: 'bg-cyan-500',
  REPLIED: 'bg-green-500',
  CLOSED: 'bg-gray-500',
};

export const getStatusColor = (status) => STATUS_COLORS[status] || 'bg-blue-500';
