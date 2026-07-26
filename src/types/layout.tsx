import React from 'react';
import { StudentHeader } from '../components/layouts/dashboard/student-header';
import { StudentSidebar } from '../components/layouts/dashboard/student-sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-grey-light">
      <StudentSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <StudentHeader />
        <main className="flex-1 p-4 sm:px-6 sm:py-0">{children}</main>
      </div>
    </div>
  );
}