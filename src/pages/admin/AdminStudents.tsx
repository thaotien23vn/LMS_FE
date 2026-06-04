import React from 'react';
import { GraduationCap } from 'lucide-react';
import AdminUsers from './AdminUsers';

const AdminStudents: React.FC = () => {
  return (
    <AdminUsers
      defaultRoleFilter="student"
      hideRoleFilter={true}
      pageTitle="Quản lý học viên"
      pageSubtitle="Quản lý tài khoản học viên"
      icon={<GraduationCap size={36} />}
    />
  );
};

export default AdminStudents;
