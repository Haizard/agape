import React from 'react';
import {
  Box,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import {
  CloudOff as CloudOffIcon,
  CloudDone as CloudDoneIcon,
  Sync as SyncIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

/**
 * SyncStatus Component
 * 
 * Displays the current sync status with the server
 */
const SyncStatus = ({
  syncStatus,
  isOnline
}) => {
  // Determine status color and icon
  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <CloudOffIcon />,
        color: 'warning',
        label: 'Offline',
        tooltip: 'You are currently offline. Changes will be saved locally and synced when you reconnect.'
      };
    }
    
    if (syncStatus.pendingSyncItems > 0) {
      return {
        icon: <SyncIcon />,
        color: 'warning',
        label: `${syncStatus.pendingSyncItems} Pending`,
        tooltip: `You have ${syncStatus.pendingSyncItems} items waiting to be synced with the server.`
      };
    }
    
    if (syncStatus.unsyncedMarks > 0) {
      return {
        icon: <WarningIcon />,
        color: 'warning',
        label: `${syncStatus.unsyncedMarks} Unsynced`,
        tooltip: `You have ${syncStatus.unsyncedMarks} marks that need to be added to the sync queue.`
      };
    }
    
    return {
      icon: <CloudDoneIcon />,
      color: 'success',
      label: 'Synced',
      tooltip: 'All changes are synced with the server.'
    };
  };
  
  const statusInfo = getStatusInfo();
  
  return (
    <Tooltip title={statusInfo.tooltip}>
      <Chip
        icon={statusInfo.icon}
        label={statusInfo.label}
        color={statusInfo.color}
        variant="outlined"
      />
    </Tooltip>
  );
};

export default SyncStatus;
