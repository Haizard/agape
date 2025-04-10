import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { Email as EmailIcon } from '@mui/icons-material';
import axios from 'axios';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/teacher/messages');
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch messages');
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    try {
      await axios.post('/api/teacher/messages', { content: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      setError('Failed to send message');
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Messages
      </Typography>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          variant="outlined"
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
        >
          Send Message
        </Button>
      </Paper>

      <List>
        {messages.map((message) => (
          <React.Fragment key={message._id}>
            <ListItem alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>
                  <EmailIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={message.sender}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {new Date(message.timestamp).toLocaleString()}
                    </Typography>
                    {" — " + message.content}
                  </>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default Messages;