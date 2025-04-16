import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Divider, 
  Chip,
  Button,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccessTime as AccessTimeIcon,
  VpnKey as VpnKeyIcon
} from '@mui/icons-material';
import { getAuthToken, isTokenValid, getUserFromToken } from '../../utils/authUtils';
import TokenRefreshButton from './TokenRefreshButton';

/**
 * TokenInfoDisplay Component
 * 
 * Displays information about the current authentication token
 */
const TokenInfoDisplay = () => {
  const [tokenInfo, setTokenInfo] = useState({
    token: null,
    isValid: false,
    user: null,
    expiresIn: null
  });
  
  // Update token info every second
  useEffect(() => {
    const updateTokenInfo = () => {
      const token = getAuthToken();
      const isValid = isTokenValid();
      const user = getUserFromToken();
      
      // Calculate time until expiration
      let expiresIn = null;
      if (user?.exp) {
        const now = Math.floor(Date.now() / 1000);
        expiresIn = user.exp - now;
      }
      
      setTokenInfo({
        token,
        isValid,
        user,
        expiresIn
      });
    };
    
    // Update immediately
    updateTokenInfo();
    
    // Then update every second
    const interval = setInterval(updateTokenInfo, 1000);
    
    // Clean up on unmount
    return () => clearInterval(interval);
  }, []);
  
  // Format the token for display
  const formatToken = (token) => {
    if (!token) return 'No token found';
    
    return token.length > 30 
      ? `${token.substring(0, 15)}...${token.substring(token.length - 10)}`
      : token;
  };
  
  // Format the expiration time
  const formatExpiresIn = (seconds) => {
    if (!seconds) return 'Unknown';
    if (seconds <= 0) return 'Expired';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  return (
    <Card variant="outlined">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <VpnKeyIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Authentication Token Info</Typography>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Token Status:</Typography>
          <Chip 
            icon={tokenInfo.isValid ? <CheckCircleIcon /> : <ErrorIcon />}
            label={tokenInfo.isValid ? 'Valid' : 'Invalid or Expired'}
            color={tokenInfo.isValid ? 'success' : 'error'}
            variant="outlined"
          />
        </Box>
        
        {tokenInfo.expiresIn !== null && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Expires In:</Typography>
            <Chip 
              icon={<AccessTimeIcon />}
              label={formatExpiresIn(tokenInfo.expiresIn)}
              color={tokenInfo.expiresIn > 300 ? 'success' : tokenInfo.expiresIn > 60 ? 'warning' : 'error'}
              variant="outlined"
            />
          </Box>
        )}
        
        {tokenInfo.user && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>User Info:</Typography>
            <Typography variant="body2">
              <strong>ID:</strong> {tokenInfo.user.id || tokenInfo.user.sub || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {tokenInfo.user.email || 'Unknown'}
            </Typography>
            <Typography variant="body2">
              <strong>Role:</strong> {tokenInfo.user.role || 'Unknown'}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Token Preview:</Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: 'monospace', 
              p: 1, 
              bgcolor: 'grey.100', 
              borderRadius: 1,
              wordBreak: 'break-all'
            }}
          >
            {formatToken(tokenInfo.token)}
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions>
        <TokenRefreshButton />
      </CardActions>
    </Card>
  );
};

export default TokenInfoDisplay;
