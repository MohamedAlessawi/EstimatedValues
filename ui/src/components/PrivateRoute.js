// src/components/PrivateRoute.js
import React, { useEffect, useState } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Center, Text, useToast } from '@chakra-ui/react';

const PrivateRoute = ({ component: Component, layout: Layout, ...rest }) => {
  const { 
    isAuthenticated, 
    loading, 
    checkTokenValidity,
    refreshAccessToken 
  } = useAuth();
  
  const [tokenChecking, setTokenChecking] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      if (!isAuthenticated) {
        setTokenChecking(false);
        setIsTokenValid(false);
        return;
      }

      try {
        console.log('🔍 Checking token validity...');
        const isValid = await checkTokenValidity();
        setIsTokenValid(isValid);
        
        if (!isValid) {
          console.log('🔄 Token invalid, attempting refresh...');
          try {
            await refreshAccessToken();
            setIsTokenValid(true);
            console.log('✅ Token refreshed successfully');
          } catch (refreshError) {
            console.error('❌ Token refresh failed:', refreshError);
            setIsTokenValid(false);
            
            toast({
              title: "انتهت الجلسة",
              description: "يرجى تسجيل الدخول مرة أخرى",
              status: "warning",
              duration: 5000,
              isClosable: true,
            });
          }
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setIsTokenValid(false);
      } finally {
        setTokenChecking(false);
      }
    };

    if (!loading) {
      verifyToken();
    }
  }, [isAuthenticated, loading, checkTokenValidity, refreshAccessToken, toast]);

  // عرض حالة التحميل
  if (loading || tokenChecking) {
    return (
      <Center h="100vh">
        <Box textAlign="center">
          <Spinner size="xl" color="blue.500" />
          <Text mt={4} fontSize="lg">
            {tokenChecking ? "checking Session..." : "جاري التحميل..."}
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated && isTokenValid ? (
          Layout ? (
            <Layout>
              <Component {...props} />
            </Layout>
          ) : (
            <Component {...props} />
          )
        ) : (
          <Redirect to="/auth/signin" />
        )
      }
    />
  );
};

export default PrivateRoute;