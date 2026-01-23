// Chakra imports
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
} from "@chakra-ui/react";
// Custom components
import Card from "components/Card/Card.js";
import CardBody from "components/Card/CardBody.js";
import React from "react";
// react icons
import { BsArrowRight } from "react-icons/bs";
import { Link } from "react-router-dom";

const WorkWithTheRockets = ({ title, description, backgroundImage }) => {
  return (
    <Card 
      p='0' 
      height="100%" 
      position="relative"
      overflow="hidden"
      borderRadius='15px'
    >
      <CardBody
        p='0'
        backgroundImage={backgroundImage}
        bgPosition='center'
        bgRepeat='no-repeat'
        bgSize='cover'
        width='100%'
        height='100%'
        minHeight='280px'
        position='relative'
      >
        {/* Overlay */}
        <Box
          bg='linear-gradient(360deg, rgba(49, 56, 96, 0.16) 0%, rgba(21, 25, 40, 0.88) 100%)'
          position='absolute'
          top='0'
          left='0'
          width='100%'
          height='100%'
          borderRadius='15px'
        />
        
        {/* Content */}
        <Flex
          position='absolute'
          top='0'
          left='0'
          width='100%'
          height='100%'
          flexDirection='column'
          color='white'
          p='24px'
          justifyContent='space-between'
          zIndex='2'
        >
          {/* Text Content */}
          <Box flex='1'>
            <Text 
              fontSize={{ base: "lg", md: "xl", lg: "2xl" }} 
              fontWeight='bold' 
              mb='12px'
              lineHeight='1.3'
            >
              {title}
            </Text>
            <Text 
              fontSize='sm' 
              fontWeight='normal'
              opacity='0.9'
              lineHeight='1.5'
            >
              {description}
            </Text>
          </Box>

          {/* Button */}
          <Flex justify='flex-start' mt='auto'>
            <Link to="/admin/create-prediction" style={{ textDecoration: 'none' }}>
              <Button 
                variant='ghost' 
                color='white'
                p='0'
                _hover={{ 
                  bg: 'transparent',
                  transform: 'translateX(8px)'
                }}
                _active={{ bg: 'transparent' }}
                transition='all 0.3s ease'
                height='auto'
              >
                <Flex align='center'>
                  <Text
                    fontSize='sm'
                    fontWeight='bold'
                    mr='8px'
                  >
                    add data
                  </Text>
                  <Icon
                    as={BsArrowRight}
                    w='16px'
                    h='16px'
                    transition='all 0.3s ease'
                  />
                </Flex>
              </Button>
            </Link>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};

export default WorkWithTheRockets;