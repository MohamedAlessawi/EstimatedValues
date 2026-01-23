// src/components/PublicRoute.js
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Center, Text } from '@chakra-ui/react';

const PublicRoute = ({ component: Component, layout: Layout, ...rest }) => {
  const { isAuthenticated, loading } = useAuth();

  // تحقق من localStorage مباشرة كبديل
  const hasTokenInStorage = localStorage.getItem('access_token');

  if (loading) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4}>جاري التحميل...</Text>
        </Box>
      </Center>
    );
  }

  // إذا كان المستخدم مسجل دخول، امنعه من الوصول لصفحات المصادقة
  const shouldRedirectToDashboard = isAuthenticated || hasTokenInStorage;

  console.log('🔐 PublicRoute Check:', {
    isAuthenticated,
    hasTokenInStorage,
    shouldRedirectToDashboard
  });

  return (
    <Route
      {...rest}
      render={(props) =>
        shouldRedirectToDashboard ? (
          <Redirect to="/admin/dashboard" />
        ) : (
          Layout ? (
            <Layout>
              <Component {...props} />
            </Layout>
          ) : (
            <Component {...props} />
          )
        )
      }
    />
  );
};

export default PublicRoute;