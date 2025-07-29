import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from './topNavbar';
import Footer from './footer';

const Layout = () => (
  <>
    <TopNavbar />
    <Outlet />
    <Footer />
  </>
);

export default Layout;
