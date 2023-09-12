import React, { ReactChild, ReactFragment, ReactPortal } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';


function Layout(props) {
  const { children } = props;

  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}

export default Layout;