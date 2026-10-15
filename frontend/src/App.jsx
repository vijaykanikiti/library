import React from "react";
import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";

import DashboardLayout from "./layouts/DashboardLayout";
import StudentDashboard from "./pages/student/StudentDashboard";
import BookCollection from "./pages/books/BookCollection";
import MyBorrowings from "./pages/student/MyBorrowings";
import Reservations from "./pages/student/Reservations";
import BorrowingHistory from "./pages/student/BorrowingHistory";
import StudentProfile from "./pages/student/StudentProfile";
import BookReviews from "./pages/student/BookReviews";
import DueDates from "./pages/student/DueDates";

import LibrarianLayout from "./layouts/LibrarianLayout";
import LibrarianDashboard from "./pages/librarian/LibrarianDashboard";
import ManageBooks from "./pages/librarian/ManageBooks";
import AddBook from "./pages/librarian/AddBook";
import IssueBook from "./pages/librarian/IssueBook";
import BookReturns from "./pages/librarian/BookReturns";
import ManageReservations from "./pages/librarian/ManageReservations";
import ManageStudents from "./pages/librarian/ManageStudents";
import OverdueBooks from "./pages/librarian/OverdueBooks";
import FineManagement from "./pages/librarian/FineManagement";
import LibraryReports from "./pages/librarian/LibraryReports";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import LibraryOverview from "./pages/admin/LibraryOverview";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import SystemSettings from "./pages/admin/SystemSettings";
import AdminProfile from "./pages/admin/AdminProfile";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="books" element={<BookCollection />} />
        <Route path="my-books" element={<MyBorrowings />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="history" element={<BorrowingHistory />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="reviews" element={<BookReviews />} />
        <Route path="due-dates" element={<DueDates />} />
      </Route>

      <Route path="/librarian" element={<LibrarianLayout />}>
        <Route
          index
          element={<Navigate to="/librarian/dashboard" replace />}
        />
        <Route path="dashboard" element={<LibrarianDashboard />} />
        <Route path="books" element={<ManageBooks />} />
        <Route path="books/add" element={<AddBook />} />
        <Route path="issue-book" element={<IssueBook />} />
        <Route path="returns" element={<BookReturns />} />
        <Route path="reservations" element={<ManageReservations />} />
        <Route path="students" element={<ManageStudents />} />
        <Route path="overdue" element={<OverdueBooks />} />
        <Route path="fines" element={<FineManagement />} />
        <Route path="reports" element={<LibraryReports />} />
      </Route>

      <Route path="/admin" element={<AdminLayout />}>
        <Route
          index
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="roles" element={<RoleManagement />} />
        <Route path="library" element={<LibraryOverview />} />
        <Route path="reports" element={<ReportsAnalytics />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="profile" element={<AdminProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;