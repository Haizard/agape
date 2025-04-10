const mongoose = require('mongoose');
const User = require('./models/User');

const updateAdminRole = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://haithammisape:hrz123@schoolsystem.mp5ul7f.mongodb.net/john_vianey?retryWrites=true&w=majority', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@example.com';
    console.log('Finding admin user with email:', adminEmail);
    const adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('Admin user not found.');
      return;
    }

    console.log('Admin user found. Current role:', adminUser.role);

    if (adminUser.role !== 'admin') {
      console.log('Updating admin user role to lowercase...');
      adminUser.role = 'admin';
      await adminUser.save();
      console.log('Admin user role updated successfully.');
    } else {
      console.log('Admin user role is already lowercase.');
    }

  } catch (error) {
    console.error('Error updating admin role:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

updateAdminRole();
