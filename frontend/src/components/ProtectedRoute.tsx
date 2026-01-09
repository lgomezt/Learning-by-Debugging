// src/components/ProtectedRoute.js
import { useEffect } from 'react'; 
import { useAuth0 } from '@auth0/auth0-react';
import { Outlet } from 'react-router-dom';
import LoadingComponent from '../utils/loadingcomponent';

const ProtectedRoute = () => {
  const isDev = import.meta.env.DEV;
  // Get the loginWithRedirect function
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();

  // In development mode, skip authentication
  if (isDev) {
    return <Outlet />;
  }

  // Use useEffect to trigger the login redirect
  useEffect(() => {
    const checkAuth = async () => {
      if (isLoading || isAuthenticated) {
        return; // Don't do anything if still loading or already logged in
      }

      // If not loading and not logged in,
      // start the login process.
      await loginWithRedirect({
        appState: {
          // This tells Auth0 where to send the user *after* they log in.
          // They'll be returned to the page they were trying to access.
          returnTo: window.location.pathname,
        },
      });
    };

    checkAuth();
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  // Update the render logic
  if (!isAuthenticated) {
    // Show a loading screen while Auth0 is loading OR
    // while we are redirecting the user to the login page.
    return <LoadingComponent message="Authenticating..." />;
  }

  // If we are authenticated, render the child routes (like /problem_selection or /ide)
  return <Outlet />;
};

export default ProtectedRoute;