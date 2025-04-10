import React from 'react';
import DepartmentLayout from '../layout/DepartmentLayout';
import ParentContactManagement from '../admin/ParentContactManagement';
import SMSSettings from '../admin/SMSSettings';
import NewsPage from '../../pages/NewsPage';

import {
  ContactPhone as ContactPhoneIcon,
  Sms as SmsIcon,
  Announcement as AnnouncementIcon
} from '@mui/icons-material';

const CommunicationManagement = () => {
  const menuItems = [
    {
      id: 'parent-contacts',
      label: 'Parent Contacts',
      icon: <ContactPhoneIcon />,
      component: <ParentContactManagement />
    },
    {
      id: 'sms-settings',
      label: 'SMS Settings',
      icon: <SmsIcon />,
      component: <SMSSettings />
    },
    {
      id: 'news',
      label: 'News',
      icon: <AnnouncementIcon />,
      component: <NewsPage />
    }
  ];

  return (
    <DepartmentLayout
      title="Communication Management"
      menuItems={menuItems}
      defaultSelected="parent-contacts"
    />
  );
};

export default CommunicationManagement;
