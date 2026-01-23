// src/views/Auth/Logout.js
import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import { 
  Box, 
  Center, 
  Spinner, 
  Text, 
  VStack 
} from "@chakra-ui/react";

function Logout() {
  const { logout } = useAuth();
  const history = useHistory();

  useEffect(() => {
    const performLogout = async () => {
      console.log('🚪 Performing logout...');
      
      // تنفيذ عملية logout
      await logout();
      
      // التوجيه إلى صفحة SignIn بعد ثانية
      setTimeout(() => {
        history.replace('/auth/signin');
      }, 1000);
    };

    performLogout();
  }, [logout, history]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="blue.500" />
        <Text fontSize="lg" fontWeight="bold">
          جاري تسجيل الخروج...
        </Text>
        <Text color="gray.600">
          يتم توجيهك إلى صفحة تسجيل الدخول
        </Text>
      </VStack>
    </Center>
  );
}

export default Logout;