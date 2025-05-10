import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
      component: <ParentContactManagement />,
      path: 'parent-contacts'
    },
    {
      id: 'sms-settings',
      label: 'SMS Settings',
      icon: <SmsIcon />,
      component: <SMSSettings />,
      path: 'sms-settings'
    },
    {
      id: 'news',
      label: 'News',
      icon: <AnnouncementIcon />,
      component: <NewsPage />,
      path: 'news'
    }
  ];

  return (
    <DepartmentLayout
      title="Communication Management"
      menuItems={menuItems}
      defaultSelected="parent-contacts"
    >
      <Routes>
        <Route path="parent-contacts" element={<ParentContactManagement />} />
        <Route path="sms-settings" element={<SMSSettings />} />
        <Route path="news" element={<NewsPage />} />
      </Routes>
    </DepartmentLayout>
  );
};

export default CommunicationManagement;
