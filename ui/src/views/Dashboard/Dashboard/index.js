// src/views/Dashboard/Dashboard/index.js

import React, { useState, useEffect } from "react";
import {
  Flex,
  Grid,
  SimpleGrid,
  useColorModeValue,
  Button,
  Box,
  Heading,
  Text,
  Link,
  HStack,
  VStack,
  Divider,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";

// assets
import predectionImage from "assets/img/predection-add.jpg";

// Custom icons
import {
  CartIcon,
  DocumentIcon,
  GlobeIcon,
  WalletIcon,
  BuildingIcon,
  CalendarIcon,
  MoneyIcon,
  ChartIcon,
  RocketIcon, // استبدال PlusIcon بـ RocketIcon
} from "components/Icons/Icons.js";

// Custom components
import MiniStatistics from "./components/MiniStatistics";
import ChartStatistics from "./components/ChartStatistics";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import LineChart from "components/Charts/LineChart";
import BarChart from "components/Charts/BarChart";
import { useAuth } from "contexts/AuthContext";

export default function Dashboard() {
  const history = useHistory();
  const { apiRequest } = useAuth();
  const toast = useToast();

  const iconBoxInside = useColorModeValue("white", "white");
  const textColor = useColorModeValue("gray.700", "white");
  const cardBg = useColorModeValue("white", "gray.700");

  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [collegesCount, setCollegesCount] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch colleges count
      const collegesResponse = await apiRequest("/colleges", { method: "GET" });
      if (collegesResponse.ok) {
        const collegesResult = await collegesResponse.json();
        if (collegesResult.success) {
          setCollegesCount(collegesResult.data.length);

          // Calculate total students and revenue
          const totalStudents = collegesResult.data.reduce(
              (sum, college) => sum + (college.current_students || 0),
              0
          );
          const totalRevenue = collegesResult.data.reduce(
              (sum, college) => sum + (college.current_annual_revenue || 0),
              0
          );

          setTotalStudents(totalStudents);
          setTotalRevenue(totalRevenue);
        }
      }

      // Fetch recent predictions
      const predictionsResponse = await apiRequest("/predict/history", { method: "GET" });
      if (predictionsResponse.ok) {
        const predictionsResult = await predictionsResponse.json();
        if (predictionsResult.success) {
          setRecentPredictions(predictionsResult.data.slice(0, 5)); // Get only 5 recent predictions
        }
      }

      // Fetch recent expenses for chart
      const expensesResponse = await apiRequest("/month-expenses?year=2024", { method: "GET" });
      if (expensesResponse.ok) {
        const expensesResult = await expensesResponse.json();
        if (expensesResult.success && expensesResult.data.length > 0) {
          // Group expenses by month
          const monthlyExpenses = {};
          expensesResult.data.forEach((expense) => {
            const month = expense.month;
            if (!monthlyExpenses[month]) {
              monthlyExpenses[month] = 0;
            }
            monthlyExpenses[month] += expense.expenses;
          });

          // Prepare chart data
          const months = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];

          const chartData = [
            {
              name: "Monthly Expenses",
              data: months.map((month, index) => {
                const monthIndex = index + 1;
                return monthlyExpenses[monthIndex] || 0;
              }),
            },
          ];

          const chartOptions = {
            xaxis: {
              categories: months,
            },
            yaxis: {
              title: {
                text: "Expenses ($)",
              },
            },
          };

          setChartData({ data: chartData, options: chartOptions });
        }
      }

      // Calculate total expenses (simplified - in real app, you'd sum all expenses)
      setTotalExpenses(125000); // Placeholder value
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <Flex justify="center" align="center" h="60vh">
          <VStack spacing={4}>
            <Spinner size="xl" color="teal.500" />
            <Text>Loading dashboard data...</Text>
          </VStack>
        </Flex>
    );
  }

  if (error) {
    return (
        <Flex justify="center" align="center" h="60vh">
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        </Flex>
    );
  }

  return (
      <Flex flexDirection="column" pt={{ base: "120px", md: "75px" }}>
        <SimpleGrid columns={{ sm: 1, md: 2, xl: 4 }} spacing="24px" mb="26px">
          <MiniStatistics
              title={"Total Colleges"}
              amount={collegesCount}
              percentage={0}
              icon={<BuildingIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
          />
          <MiniStatistics
              title={"Total Students"}
              amount={totalStudents.toLocaleString()}
              percentage={5}
              icon={<GlobeIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
          />
          <MiniStatistics
              title={"Total Revenue"}
              amount={`$${totalRevenue.toLocaleString()}`}
              percentage={8}
              icon={<WalletIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
          />
          <MiniStatistics
              title={"Total Expenses"}
              amount={`$${totalExpenses.toLocaleString()}`}
              percentage={-3}
              icon={<MoneyIcon h={"24px"} w={"24px"} color={iconBoxInside} />}
          />
        </SimpleGrid>

        <Grid
            templateColumns={{ md: "1fr", lg: "1.8fr 1.2fr" }}
            templateRows={{ md: "1fr auto", lg: "1fr" }}
            my="26px"
            gap="24px"
        >
          <Card>
            <CardHeader>
              <Heading size="md" color={textColor} mb="4">
                Monthly Expenses Overview
              </Heading>
            </CardHeader>
            <CardBody>
              {chartData ? (
                  <Box h="300px">
                    <LineChart
                        chartData={chartData.data}
                        chartOptions={chartData.options}
                        height="300px"
                    />
                  </Box>
              ) : (
                  <Flex justify="center" align="center" h="300px">
                    <Text>No expense data available</Text>
                  </Flex>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md" color={textColor} mb="4">
                Quick Actions
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4} align="stretch">
                <Button
                    leftIcon={<BuildingIcon />}
                    colorScheme="teal"
                    onClick={() => history.push("/admin/colleges")}
                >
                  Add New College
                </Button>
                <Button
                    leftIcon={<ChartIcon />}
                    colorScheme="teal"
                    onClick={() => history.push("/admin/predictions")}
                >
                  Create New Prediction
                </Button>
                <Button
                    leftIcon={<CalendarIcon />}
                    colorScheme="teal"
                    onClick={() => history.push("/admin/month-expenses")}
                >
                  Add Monthly Expense
                </Button>
                <Button
                    leftIcon={<CalendarIcon />}
                    colorScheme="teal"
                    onClick={() => history.push("/admin/year-stats")}
                >
                  Add Year Statistics
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Grid
            templateColumns={{ md: "1fr", lg: "1fr 1fr" }}
            templateRows={{ md: "1fr auto", lg: "1fr" }}
            my="26px"
            gap="24px"
        >
          <Card>
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color={textColor}>
                  Recent Predictions
                </Heading>
                <Link
                    as={RouterLink}
                    to="/admin/predictions"
                    color="teal.500"
                    fontWeight="bold"
                >
                  View All
                </Link>
              </Flex>
            </CardHeader>
            <CardBody>
              {recentPredictions.length > 0 ? (
                  <VStack spacing={3} align="stretch">
                    {recentPredictions.map((prediction) => (
                        <Box
                            key={prediction.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            borderColor={useColorModeValue("gray.200", "gray.600")}
                        >
                          <Flex justify="space-between" align="center">
                            <Box>
                              <Text fontWeight="bold">{prediction.title}</Text>
                              <Text fontSize="sm" color="gray.500">
                                {prediction.metric} • {prediction.period_type}
                              </Text>
                            </Box>
                            <Button
                                size="sm"
                                colorScheme="teal"
                                variant="outline"
                                onClick={() => history.push(`/admin/predictions`)}
                            >
                              View
                            </Button>
                          </Flex>
                        </Box>
                    ))}
                  </VStack>
              ) : (
                  <Flex justify="center" align="center" h="200px">
                    <Text>No predictions yet</Text>
                  </Flex>
              )}
            </CardBody>
          </Card>

          <Card
              backgroundImage={`url(${predectionImage})`}
              backgroundSize="cover"
              backgroundPosition="center"
          >
            <CardBody>
              <VStack
                  spacing={4}
                  align="center"
                  justify="center"
                  h="100%"
                  bg={useColorModeValue("rgba(255, 255, 255, 0.9)", "rgba(0, 0, 0, 0.7)")}
                  borderRadius="md"
                  p={6}
              >
                <Heading size="md" color={textColor} textAlign="center">
                  Start Predicting Your Data
                </Heading>
                <Text textAlign="center" color={textColor}>
                  Create predictions for expenses, revenue, students, and more with our advanced prediction tools.
                </Text>
                <Button
                    leftIcon={<ChartIcon />}
                    colorScheme="teal"
                    onClick={() => history.push("/admin/predictions")}
                >
                  Create Prediction
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Grid>
      </Flex>
  );
}