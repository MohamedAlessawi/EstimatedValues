// Chakra imports
import { Flex, Switch, Text, useColorModeValue, Box } from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import React from "react";

const PlatformSettings = ({ title, subtitle1, subtitle2, userData }) => {
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  
  return (
    <Card p='16px'>
      <CardHeader p='12px 5px' mb='12px'>
        <Text fontSize='lg' color={textColor} fontWeight='bold'>
          {title}
        </Text>
      </CardHeader>
      <CardBody px='5px'>
        <Flex direction='column'>
          <Text fontSize='sm' color='gray.500' fontWeight='600' mb='20px'>
            {subtitle1}
          </Text>
          
          {/* معلومات الحساب من API */}
          {userData && (
            <Box mb='20px' p='10px' bg='gray.50' borderRadius='8px'>
              <Flex align='center' mb='8px'>
                <Text fontSize='sm' color='gray.700' fontWeight='500' minW='120px'>
                  حالة الحساب:
                </Text>
                <Text 
                  fontSize='sm' 
                  color={userData.is_active ? 'green.500' : 'red.500'} 
                  fontWeight='400'
                >
                  {userData.is_active ? "نشط" : "غير نشط"}
                </Text>
              </Flex>
              <Flex align='center' mb='8px'>
                <Text fontSize='sm' color='gray.700' fontWeight='500' minW='120px'>
                  البريد المؤكد:
                </Text>
                <Text 
                  fontSize='sm' 
                  color={userData.email_verified_at ? 'green.500' : 'red.500'} 
                  fontWeight='400'
                >
                  {userData.email_verified_at ? "نعم" : "لا"}
                </Text>
              </Flex>
              <Flex align='center' mb='8px'>
                <Text fontSize='sm' color='gray.700' fontWeight='500' minW='120px'>
                  المصادقة الثنائية:
                </Text>
                <Text 
                  fontSize='sm' 
                  color={userData.two_factor_enabled ? 'green.500' : 'gray.500'} 
                  fontWeight='400'
                >
                  {userData.two_factor_enabled ? "مفعلة" : "غير مفعلة"}
                </Text>
              </Flex>
              <Flex align='center'>
                <Text fontSize='sm' color='gray.700' fontWeight='500' minW='120px'>
                  آخر تحديث:
                </Text>
                <Text fontSize='sm' color='gray.500' fontWeight='400'>
                  {new Date(userData.updated_at).toLocaleDateString('ar-EG')}
                </Text>
              </Flex>
            </Box>
          )}

          <Text fontSize='sm' color='gray.500' fontWeight='600' mb='20px'>
            {subtitle2}
          </Text>
          
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              إرسال إشعارات عندما يتابعني شخص
            </Text>
          </Flex>
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              إرسال إشعارات عندما يرد أحد على منشوري
            </Text>
          </Flex>
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              إرسال إشعارات عندما يذكرني أحد
            </Text>
          </Flex>
          <Text
            fontSize='sm'
            color='gray.500'
            fontWeight='600'
            m='6px 0px 20px 0px'>
            إشعارات التطبيق
          </Text>
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              الإطلاقات والمشاريع الجديدة
            </Text>
          </Flex>
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              التغييرات الشهرية للمنتج
            </Text>
          </Flex>
          <Flex align='center' mb='20px'>
            <Switch colorScheme='teal' me='10px' />
            <Text noOfLines={1} fontSize='md' color='gray.500' fontWeight='400'>
              الاشتراك في النشرة الإخبارية
            </Text>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default PlatformSettings;