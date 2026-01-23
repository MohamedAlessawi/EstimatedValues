// src/views/Dashboard/Predictions/Predictions.js

import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Input,
    InputGroup,
    InputLeftElement,
    Table,
    Tbody,
    Td,
    Th,
    Thead,
    Tr,
    useColorModeValue,
    Icon,
    IconButton,
    Spinner,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    HStack,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    FormControl,
    FormLabel,
    Heading,
    Text,
    useToast,
    Flex,
    Badge,
    Select,
    Textarea,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    SimpleGrid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Stack,
    Divider,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useHistory } from "react-router-dom";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import { useAuth } from "contexts/AuthContext";
import LineChart from "components/Charts/LineChart";
import BarChart from "components/Charts/BarChart";

const Predictions = () => {
    const history = useHistory();
    const { apiRequest, getColleges } = useAuth();
    const toast = useToast();

    const [predictions, setPredictions] = useState([]);
    const [filteredPredictions, setFilteredPredictions] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [availablePeriods, setAvailablePeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collegesLoading, setCollegesLoading] = useState(false);
    const [periodsLoading, setPeriodsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("created_at");
    const [sortOrder, setSortOrder] = useState("desc");
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedPrediction, setSelectedPrediction] = useState(null);

    // Form states
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [scopeType, setScopeType] = useState("college");
    const [scopeId, setScopeId] = useState("");
    const [metric, setMetric] = useState("expenses");
    const [periodType, setPeriodType] = useState("monthly");
    const [futureSteps, setFutureSteps] = useState("6");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);
    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    // Prediction details states
    const [predictionDetails, setPredictionDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [originalChartData, setOriginalChartData] = useState(null);
    const [predictionChartData, setPredictionChartData] = useState(null);

    const textColor = useColorModeValue("gray.700", "white");
    const borderColor = useColorModeValue("gray.200", "gray.600");
    const cardBg = useColorModeValue("white", "gray.700");

    useEffect(() => {
        fetchColleges();
        fetchPredictions();
    }, []);

    useEffect(() => {
        filterAndSortPredictions();
    }, [predictions, searchTerm, sortBy, sortOrder]);

    // جلب الفترات المتاحة عند تغيير الإعدادات
    useEffect(() => {
        if (scopeType && metric && periodType) {
            if (scopeType === "college" && scopeId) {
                fetchAvailablePeriods();
            } else if (scopeType === "university") {
                fetchAvailablePeriods();
            } else {
                setAvailablePeriods([]);
            }
        } else {
            setAvailablePeriods([]);
        }
    }, [scopeType, scopeId, metric, periodType]);

    const fetchColleges = async () => {
        try {
            setCollegesLoading(true);
            const result = await getColleges();
            if (result.success) {
                setColleges(result.data);
            } else {
                throw new Error(result.message || "Failed to fetch colleges");
            }
        } catch (error) {
            console.error("Error fetching colleges:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch colleges",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setCollegesLoading(false);
        }
    };

    const fetchAvailablePeriods = async () => {
        try {
            setPeriodsLoading(true);
            let url = `/predict/periods?scope_type=${scopeType}&metric=${metric}&period_type=${periodType}`;

            if (scopeType === "college" && scopeId) {
                url += `&scope_id=${scopeId}`;
            }

            const result = await apiRequest(url, { method: "GET" });
            const data = await result.json();

            if (data.success) {
                setAvailablePeriods(data.data.periods || []);

                // تحضير البيانات للرسم البياني
                if (data.data.periods && data.data.periods.length > 0) {
                    const chartData = [
                        {
                            name: `${metric} data`,
                            data: data.data.periods.map(p => p.value || 0),
                        },
                    ];

                    const chartOptions = {
                        xaxis: {
                            categories: data.data.periods.map(p => p.label),
                        },
                        yaxis: {
                            title: {
                                text: metric,
                            },
                        },
                    };

                    setChartData({ data: chartData, options: chartOptions });
                } else {
                    setChartData([]);
                }
            } else {
                throw new Error(data.message || "Failed to fetch available periods");
            }
        } catch (error) {
            console.error("Error fetching available periods:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch available periods",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            setAvailablePeriods([]);
            setChartData([]);
        } finally {
            setPeriodsLoading(false);
        }
    };

    const fetchPredictions = async () => {
        try {
            setLoading(true);
            const response = await apiRequest("/predict/history", { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setPredictions(result.data);
                } else {
                    throw new Error(result.message || "Failed to fetch predictions");
                }
            } else {
                throw new Error("Failed to fetch predictions");
            }
        } catch (error) {
            console.error("Error fetching predictions:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch predictions",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // جلب تفاصيل التنبؤ
    const fetchPredictionDetails = async (id) => {
        try {
            setDetailsLoading(true);
            const response = await apiRequest(`/predict/history/${id}`, { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setPredictionDetails(result.data);

                    // تحضير بيانات الرسم البياني للبيانات الأصلية
                    if (result.data.original_values && result.data.original_values.length > 0) {
                        const originalChartData = [
                            {
                                name: `${result.data.metric} - Original`,
                                data: result.data.original_values.map(p => p.value || 0),
                            },
                        ];

                        const originalChartOptions = {
                            xaxis: {
                                categories: result.data.original_values.map(p => {
                                    const date = new Date(p.period_date);
                                    return date.toLocaleDateString();
                                }),
                            },
                            yaxis: {
                                title: {
                                    text: result.data.metric,
                                },
                            },
                        };

                        setOriginalChartData({ data: originalChartData, options: originalChartOptions });
                    } else {
                        setOriginalChartData(null);
                    }

                    // تحضير بيانات الرسم البياني للتنبؤات
                    if (result.data.labeled_results && result.data.labeled_results.length > 0) {
                        const predictionChartData = [
                            {
                                name: `${result.data.metric} - Predicted`,
                                data: result.data.labeled_results.map(p => p.value || 0),
                            },
                        ];

                        const predictionChartOptions = {
                            xaxis: {
                                categories: result.data.labeled_results.map(p => p.label),
                            },
                            yaxis: {
                                title: {
                                    text: result.data.metric,
                                },
                            },
                        };

                        setPredictionChartData({ data: predictionChartData, options: predictionChartOptions });
                    } else {
                        setPredictionChartData(null);
                    }
                } else {
                    throw new Error(result.message || "Failed to fetch prediction details");
                }
            } else {
                throw new Error("Failed to fetch prediction details");
            }
        } catch (error) {
            console.error("Error fetching prediction details:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch prediction details",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            setPredictionDetails(null);
            setOriginalChartData(null);
            setPredictionChartData(null);
        } finally {
            setDetailsLoading(false);
        }
    };

    const filterAndSortPredictions = () => {
        let filtered = [...predictions];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(prediction =>
                prediction.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prediction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prediction.metric.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            let valueA = a[sortBy];
            let valueB = b[sortBy];

            if (typeof valueA === "string") {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }

            if (sortOrder === "asc") {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

        setFilteredPredictions(filtered);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const handleDeletePrediction = async (id) => {
        if (!window.confirm("Are you sure you want to delete this prediction?")) {
            return;
        }

        try {
            setDeleteLoading(id);
            const response = await apiRequest(`/predict/history/${id}`, { method: "DELETE" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Prediction deleted successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchPredictions();
                } else {
                    throw new Error(result.message || "Failed to delete prediction");
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete prediction");
            }
        } catch (error) {
            console.error("Error deleting prediction:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete prediction",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const getMetricColor = (metric) => {
        switch (metric) {
            case "expenses":
                return "red";
            case "revenue":
                return "green";
            case "students":
                return "blue";
            case "profit":
                return "purple";
            default:
                return "gray";
        }
    };

    const getScopeTypeColor = (scopeType) => {
        switch (scopeType) {
            case "college":
                return "teal";
            case "university":
                return "orange";
            default:
                return "gray";
        }
    };

    // Modal handlers
    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openDetailsModal = (prediction) => {
        setSelectedPrediction(prediction);
        setIsDetailsModalOpen(true);
        // جلب تفاصيل التنبؤ
        fetchPredictionDetails(prediction.id);
    };

    const openEditModal = (prediction) => {
        setSelectedPrediction(prediction);
        setTitle(prediction.title);
        setDescription(prediction.description);
        setScopeType(prediction.scope_type);
        setScopeId(prediction.scope_id.toString());
        setMetric(prediction.metric);
        setPeriodType(prediction.period_type);
        setFutureSteps(prediction.future_steps.toString());
        setIsEditModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetForm();
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedPrediction(null);
        setPredictionDetails(null);
        setOriginalChartData(null);
        setPredictionChartData(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedPrediction(null);
        resetForm();
    };

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setScopeType("college");
        setScopeId("");
        setMetric("expenses");
        setPeriodType("monthly");
        setFutureSteps("6");
        setErrors({});
        setHasChanges(false);
        setChartData([]);
        setAvailablePeriods([]);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!title.trim()) {
            newErrors.title = "Title is required";
        }

        if (!description.trim()) {
            newErrors.description = "Description is required";
        }

        if (!scopeType) {
            newErrors.scopeType = "Scope type is required";
        }

        if (scopeType === "college" && !scopeId) {
            newErrors.scopeId = "Please select a college";
        }

        if (!metric) {
            newErrors.metric = "Metric is required";
        }

        if (!periodType) {
            newErrors.periodType = "Period type is required";
        }

        if (!futureSteps || isNaN(futureSteps) || parseInt(futureSteps) < 1 || parseInt(futureSteps) > 24) {
            newErrors.futureSteps = "Future steps must be between 1 and 24";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);

            const predictionData = {
                title: title.trim(),
                description: description.trim(),
                scope_type: scopeType,
                metric: metric,
                period_type: periodType,
                future_steps: parseInt(futureSteps),
            };

            // إضافة scope_id فقط إذا كان scope_type = college
            if (scopeType === "college") {
                predictionData.scope_id = parseInt(scopeId);
            }

            let response;
            if (isEditModalOpen && selectedPrediction) {
                // Update existing prediction
                response = await apiRequest(`/predict/history/${selectedPrediction.id}`, {
                    method: "PUT",
                    body: JSON.stringify(predictionData),
                });
            } else {
                // Create new prediction
                response = await apiRequest("/predict", {
                    method: "POST",
                    body: JSON.stringify(predictionData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: isEditModalOpen ? "Prediction updated successfully" : "Prediction created successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchPredictions();
                    closeCreateModal();
                    closeEditModal();
                } else {
                    throw new Error(result.message || "Failed to save prediction");
                }
            } else {
                const result = await response.json();
                if (result.errors) {
                    setErrors(result.errors);
                }
                throw new Error(result.message || "Failed to save prediction");
            }
        } catch (error) {
            console.error("Error saving prediction:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save prediction",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedPrediction) {
            const isChanged =
                title !== selectedPrediction.title ||
                description !== selectedPrediction.description ||
                scopeType !== selectedPrediction.scope_type ||
                scopeId !== selectedPrediction.scope_id.toString() ||
                metric !== selectedPrediction.metric ||
                periodType !== selectedPrediction.period_type ||
                futureSteps !== selectedPrediction.future_steps.toString();

            setHasChanges(isChanged);
        }
    }, [title, description, scopeType, scopeId, metric, periodType, futureSteps, selectedPrediction]);

    return (
        <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
            <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
                <CardHeader p="6px 0px 22px 0px">
                    <Flex direction="column">
                        <Text fontSize="xl" color={textColor} fontWeight="bold" mb="10px">
                            Predictions Management
                        </Text>
                        <Flex justify="space-between" align="center">
                            <InputGroup width={{ base: "100%", md: "300px" }}>
                                <InputLeftElement
                                    pointerEvents="none"
                                    children={<SearchIcon color="gray.300" />}
                                />
                                <Input
                                    type="text"
                                    placeholder="Search predictions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="teal"
                                onClick={openCreateModal}
                            >
                                Create Prediction
                            </Button>
                        </Flex>
                    </Flex>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <Flex justify="center" py="20px">
                            <Spinner size="xl" color="teal.500" />
                        </Flex>
                    ) : filteredPredictions.length > 0 ? (
                        <Table variant="simple" color={textColor}>
                            <Thead>
                                <Tr>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("title")}>
                                        <Flex align="center">
                                            Title
                                            {sortBy === "title" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("metric")}>
                                        <Flex align="center">
                                            Metric
                                            {sortBy === "metric" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("scope_type")}>
                                        <Flex align="center">
                                            Scope
                                            {sortBy === "scope_type" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("period_type")}>
                                        <Flex align="center">
                                            Period
                                            {sortBy === "period_type" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("created_at")}>
                                        <Flex align="center">
                                            Created At
                                            {sortBy === "created_at" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor}>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredPredictions.map((prediction) => (
                                    <Tr key={prediction.id}>
                                        <Td borderColor={borderColor}>
                                            <Text fontWeight="bold">{prediction.title}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme={getMetricColor(prediction.metric)}>
                                                {prediction.metric}
                                            </Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme={getScopeTypeColor(prediction.scope_type)}>
                                                {prediction.scope_type} {prediction.scope_id ? `(${prediction.scope_id})` : ""}
                                            </Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme="blue">
                                                {prediction.period_type}
                                            </Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            {new Date(prediction.created_at).toLocaleDateString()}
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <HStack spacing="2">
                                                <IconButton
                                                    aria-label="View prediction"
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    colorScheme="blue"
                                                    onClick={() => openDetailsModal(prediction)}
                                                />
                                                <IconButton
                                                    aria-label="Edit prediction"
                                                    icon={<EditIcon />}
                                                    size="sm"
                                                    colorScheme="yellow"
                                                    onClick={() => openEditModal(prediction)}
                                                />
                                                <IconButton
                                                    aria-label="Delete prediction"
                                                    icon={<DeleteIcon />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    onClick={() => handleDeletePrediction(prediction.id)}
                                                    isLoading={deleteLoading === prediction.id}
                                                />
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    ) : (
                        <Alert status="info" borderRadius="md">
                            <AlertIcon />
                            <AlertTitle>No predictions found!</AlertTitle>
                            <AlertDescription>
                                {searchTerm ? "Try adjusting your search criteria" : "Create your first prediction to get started"}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardBody>
            </Card>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateModalOpen || isEditModalOpen} onClose={isCreateModalOpen ? closeCreateModal : closeEditModal} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {isEditModalOpen ? "Edit Prediction" : "Create New Prediction"}
                    </ModalHeader>
                    <ModalBody>
                        {Object.keys(errors).length > 0 && (
                            <Alert status="error" mb="6">
                                <AlertIcon />
                                <AlertTitle>Validation Error</AlertTitle>
                                <AlertDescription>
                                    Please fix the errors below
                                </AlertDescription>
                            </Alert>
                        )}

                        <FormControl as="form" onSubmit={handleSubmit}>
                            <SimpleGrid columns={{ base: 1, md: 2 }} spacing="6" mb="6">
                                <Box>
                                    <FormLabel htmlFor="title">Title</FormLabel>
                                    <Input
                                        id="title"
                                        placeholder="Enter prediction title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        isInvalid={errors.title}
                                    />
                                    {errors.title && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.title}
                                        </Text>
                                    )}
                                </Box>

                                <Box>
                                    <FormLabel htmlFor="futureSteps">Future Steps</FormLabel>
                                    <Input
                                        id="futureSteps"
                                        type="number"
                                        min="1"
                                        max="24"
                                        placeholder="Number of future periods to predict"
                                        value={futureSteps}
                                        onChange={(e) => setFutureSteps(e.target.value)}
                                        isInvalid={errors.futureSteps}
                                    />
                                    {errors.futureSteps && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.futureSteps}
                                        </Text>
                                    )}
                                </Box>
                            </SimpleGrid>

                            <Box mb="6">
                                <FormLabel htmlFor="description">Description</FormLabel>
                                <Textarea
                                    id="description"
                                    placeholder="Enter prediction description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    isInvalid={errors.description}
                                    rows={3}
                                />
                                {errors.description && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.description}
                                    </Text>
                                )}
                            </Box>

                            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="6">
                                <Box>
                                    <FormLabel htmlFor="scopeType">Scope Type</FormLabel>
                                    <Select
                                        id="scopeType"
                                        placeholder="Select scope type"
                                        value={scopeType}
                                        onChange={(e) => {
                                            setScopeType(e.target.value);
                                            if (e.target.value === "university") {
                                                setScopeId(""); // مسح scope_id عند التغيير إلى university
                                            }
                                        }}
                                        isInvalid={errors.scopeType}
                                    >
                                        <option value="college">College</option>
                                        <option value="university">University</option>
                                    </Select>
                                    {errors.scopeType && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.scopeType}
                                        </Text>
                                    )}
                                </Box>

                                <Box>
                                    <FormLabel htmlFor="scopeId">College</FormLabel>
                                    <Select
                                        id="scopeId"
                                        placeholder="Select a college"
                                        value={scopeId}
                                        onChange={(e) => setScopeId(e.target.value)}
                                        isInvalid={errors.scopeId}
                                        isDisabled={scopeType !== "college" || collegesLoading}
                                        opacity={scopeType === "university" ? 0.4 : 1}
                                    >
                                        {colleges.map((college) => (
                                            <option key={college.id} value={college.id}>
                                                {college.name}
                                            </option>
                                        ))}
                                    </Select>
                                    {errors.scopeId && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.scopeId}
                                        </Text>
                                    )}
                                    {scopeType === "university" && (
                                        <Text color="gray.500" fontSize="sm" mt="1">
                                            Not applicable for university scope
                                        </Text>
                                    )}
                                </Box>

                                <Box>
                                    <FormLabel htmlFor="metric">Metric</FormLabel>
                                    <Select
                                        id="metric"
                                        placeholder="Select metric"
                                        value={metric}
                                        onChange={(e) => setMetric(e.target.value)}
                                        isInvalid={errors.metric}
                                    >
                                        <option value="expenses">Expenses</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="students">Students</option>
                                        <option value="profit">Profit</option>
                                    </Select>
                                    {errors.metric && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.metric}
                                        </Text>
                                    )}
                                </Box>

                                <Box>
                                    <FormLabel htmlFor="periodType">Period Type</FormLabel>
                                    <Select
                                        id="periodType"
                                        placeholder="Select period type"
                                        value={periodType}
                                        onChange={(e) => setPeriodType(e.target.value)}
                                        isInvalid={errors.periodType}
                                    >
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </Select>
                                    {errors.periodType && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.periodType}
                                        </Text>
                                    )}
                                </Box>
                            </SimpleGrid>

                            {/* قسم عرض الفترات المتاحة والرسم البياني */}
                            {(scopeType === "university" || (scopeType === "college" && scopeId)) && (
                                <Box mb="6">
                                    <Divider mb="4" />
                                    <Text fontSize="lg" fontWeight="bold" mb="4">
                                        Available Periods
                                    </Text>
                                    {periodsLoading ? (
                                        <Flex justify="center" py="20px">
                                            <Spinner size="xl" color="teal.500" />
                                        </Flex>
                                    ) : availablePeriods.length > 0 ? (
                                        <Stack spacing={4}>
                                            <Box>
                                                <Text fontWeight="semibold" mb="2">
                                                    Found {availablePeriods.length} periods
                                                </Text>
                                                <Box height="300px">
                                                    {metric === "expenses" ? (
                                                        <BarChart
                                                            chartData={chartData.data}
                                                            chartOptions={chartData.options}
                                                            height="300px"
                                                        />
                                                    ) : (
                                                        <LineChart
                                                            chartData={chartData.data}
                                                            chartOptions={chartData.options}
                                                            height="300px"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Stack>
                                    ) : (
                                        <Alert status="info" borderRadius="md">
                                            <AlertIcon />
                                            <Box>
                                                <AlertTitle>No data available</AlertTitle>
                                                <AlertDescription>
                                                    No historical data found for selected criteria. The prediction will be created based on available data.
                                                </AlertDescription>
                                            </Box>
                                        </Alert>
                                    )}
                                </Box>
                            )}
                        </FormControl>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            mr={3}
                            onClick={isCreateModalOpen ? closeCreateModal : closeEditModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="teal"
                            onClick={handleSubmit}
                            isLoading={isLoading}
                            loadingText={isEditModalOpen ? "Updating..." : "Creating..."}
                            disabled={isEditModalOpen && !hasChanges}
                            opacity={isEditModalOpen && !hasChanges ? 0.6 : 1}
                        >
                            {isEditModalOpen ? "Update Prediction" : "Create Prediction"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Prediction Details: {selectedPrediction?.title}
                    </ModalHeader>
                    <ModalBody>
                        {selectedPrediction && (
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Original Data</Tab>
                                    <Tab>Predictions</Tab>
                                    <Tab>Raw Results</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel>
                                        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="6" mb="6">
                                            <Card bg={cardBg}>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Metric</StatLabel>
                                                        <StatNumber>
                                                            <Badge colorScheme={getMetricColor(selectedPrediction.metric)}>
                                                                {selectedPrediction.metric}
                                                            </Badge>
                                                        </StatNumber>
                                                        <StatHelpText>Prediction metric</StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>

                                            <Card bg={cardBg}>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Scope</StatLabel>
                                                        <StatNumber>
                                                            <Badge colorScheme={getScopeTypeColor(selectedPrediction.scope_type)}>
                                                                {selectedPrediction.scope_type} {selectedPrediction.scope_id ? `(${selectedPrediction.scope_id})` : ""}
                                                            </Badge>
                                                        </StatNumber>
                                                        <StatHelpText>Prediction scope</StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>

                                            <Card bg={cardBg}>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Period</StatLabel>
                                                        <StatNumber>
                                                            <Badge colorScheme="blue">
                                                                {selectedPrediction.period_type}
                                                            </Badge>
                                                        </StatNumber>
                                                        <StatHelpText>Prediction period</StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>

                                            <Card bg={cardBg}>
                                                <CardBody>
                                                    <Stat>
                                                        <StatLabel>Future Steps</StatLabel>
                                                        <StatNumber>{selectedPrediction.future_steps}</StatNumber>
                                                        <StatHelpText>Number of predictions</StatHelpText>
                                                    </Stat>
                                                </CardBody>
                                            </Card>
                                        </SimpleGrid>

                                        <Card bg={cardBg} mb="6">
                                            <CardHeader>
                                                <Heading as="h2" size="md" color={textColor}>
                                                    Prediction Information
                                                </Heading>
                                            </CardHeader>
                                            <CardBody>
                                                <Flex direction="column" gap="4">
                                                    <Box>
                                                        <Text fontWeight="bold" mb="2">Title</Text>
                                                        <Text>{selectedPrediction.title}</Text>
                                                    </Box>

                                                    <Box>
                                                        <Text fontWeight="bold" mb="2">Description</Text>
                                                        <Text>{selectedPrediction.description}</Text>
                                                    </Box>

                                                    <Flex gap="4">
                                                        <Box>
                                                            <Text fontWeight="bold" mb="2">Metric</Text>
                                                            <Badge colorScheme={getMetricColor(selectedPrediction.metric)}>
                                                                {selectedPrediction.metric}
                                                            </Badge>
                                                        </Box>

                                                        <Box>
                                                            <Text fontWeight="bold" mb="2">Scope</Text>
                                                            <Badge colorScheme={getScopeTypeColor(selectedPrediction.scope_type)}>
                                                                {selectedPrediction.scope_type} {selectedPrediction.scope_id ? `(${selectedPrediction.scope_id})` : ""}
                                                            </Badge>
                                                        </Box>

                                                        <Box>
                                                            <Text fontWeight="bold" mb="2">Period</Text>
                                                            <Badge colorScheme="blue">
                                                                {selectedPrediction.period_type}
                                                            </Badge>
                                                        </Box>
                                                    </Flex>

                                                    <Flex justify="space-between">
                                                        <Box>
                                                            <Text fontWeight="bold" mb="2">Created At</Text>
                                                            <Text>{new Date(selectedPrediction.created_at).toLocaleDateString()}</Text>
                                                        </Box>

                                                        <Box>
                                                            <Text fontWeight="bold" mb="2">Last Updated</Text>
                                                            <Text>{new Date(selectedPrediction.updated_at).toLocaleDateString()}</Text>
                                                        </Box>
                                                    </Flex>
                                                </Flex>
                                            </CardBody>
                                        </Card>
                                    </TabPanel>

                                    <TabPanel>
                                        <Card bg={cardBg}>
                                            <CardHeader>
                                                <Heading as="h2" size="md" color={textColor}>
                                                    Original Data
                                                </Heading>
                                            </CardHeader>
                                            <CardBody>
                                                {detailsLoading ? (
                                                    <Flex justify="center" py="20px">
                                                        <Spinner size="xl" color="teal.500" />
                                                    </Flex>
                                                ) : originalChartData ? (
                                                    <Box height="400px">
                                                        {selectedPrediction.metric === "expenses" ? (
                                                            <BarChart
                                                                chartData={originalChartData.data}
                                                                chartOptions={originalChartData.options}
                                                                height="400px"
                                                            />
                                                        ) : (
                                                            <LineChart
                                                                chartData={originalChartData.data}
                                                                chartOptions={originalChartData.options}
                                                                height="400px"
                                                            />
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Alert status="info" borderRadius="md">
                                                        <AlertIcon />
                                                        <Box>
                                                            <AlertTitle>No original data available</AlertTitle>
                                                            <AlertDescription>
                                                                No original data found for this prediction.
                                                            </AlertDescription>
                                                        </Box>
                                                    </Alert>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </TabPanel>
                                    // استبدل قسم Predictions TabPanel بالكود التالي:

                                    <TabPanel>
                                        <Card bg={cardBg}>
                                            <CardHeader>
                                                <Heading as="h2" size="md" color={textColor}>
                                                    Predictions
                                                </Heading>
                                            </CardHeader>
                                            <CardBody>
                                                {detailsLoading ? (
                                                    <Flex justify="center" py="20px">
                                                        <Spinner size="xl" color="teal.500" />
                                                    </Flex>
                                                ) : predictionChartData ? (
                                                    <Box height="400px" width="100%" overflow="hidden">
                                                        {selectedPrediction.metric === "expenses" ? (
                                                            <BarChart
                                                                chartData={predictionChartData.data}
                                                                chartOptions={{
                                                                    ...predictionChartData.options,
                                                                    chart: {
                                                                        ...predictionChartData.options?.chart,
                                                                        toolbar: {
                                                                            show: true,
                                                                            tools: {
                                                                                download: true,
                                                                                selection: true,
                                                                                zoom: true,
                                                                                zoomin: true,
                                                                                zoomout: true,
                                                                                pan: true,
                                                                                reset: true
                                                                            }
                                                                        },
                                                                        background: 'transparent',
                                                                        foreColor: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                        zoom: {
                                                                            enabled: true,
                                                                            type: 'x',
                                                                            autoScaleYaxis: true
                                                                        }
                                                                    },
                                                                    plotOptions: {
                                                                        bar: {
                                                                            borderRadius: 6,
                                                                            columnWidth: '40%', // تقليل عرض الأعمدة لزيادة المسافات
                                                                            dataLabels: {
                                                                                position: 'top',
                                                                                enabled: true,
                                                                                formatter: function (val) {
                                                                                    return val.toFixed(2);
                                                                                },
                                                                                offsetY: -20,
                                                                                style: {
                                                                                    fontSize: '11px',
                                                                                    colors: [useColorModeValue("#2D3748", "#E2E8F0")],
                                                                                    fontWeight: 600
                                                                                },
                                                                                background: {
                                                                                    enabled: true,
                                                                                    foreColor: cardBg,
                                                                                    padding: 4,
                                                                                    borderRadius: 2,
                                                                                    borderWidth: 1,
                                                                                    borderColor: useColorModeValue("#E2E8F0", "#4A5568"),
                                                                                    opacity: 0.9
                                                                                }
                                                                            }
                                                                        }
                                                                    },
                                                                    xaxis: {
                                                                        ...predictionChartData.options?.xaxis,
                                                                        categories: predictionChartData.options?.xaxis?.categories || [],
                                                                        labels: {
                                                                            style: {
                                                                                colors: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '11px'
                                                                            },
                                                                            rotate: -45, // تدوير التسميات لتوفير مساحة
                                                                            rotateAlways: true,
                                                                            trim: true,
                                                                            maxHeight: 80
                                                                        },
                                                                        tickAmount: undefined, // السماح بعدد غير محدد من النقاط
                                                                        tickPlacement: 'on',
                                                                        axisBorder: {
                                                                            show: true,
                                                                            color: useColorModeValue("#E2E8F0", "#4A5568")
                                                                        },
                                                                        axisTicks: {
                                                                            show: true,
                                                                            color: useColorModeValue("#E2E8F0", "#4A5568")
                                                                        }
                                                                    },
                                                                    yaxis: {
                                                                        ...predictionChartData.options?.yaxis,
                                                                        title: {
                                                                            text: selectedPrediction.metric,
                                                                            style: {
                                                                                color: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '12px',
                                                                                fontWeight: 600
                                                                            }
                                                                        },
                                                                        labels: {
                                                                            style: {
                                                                                colors: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '11px'
                                                                            },
                                                                            formatter: function (value) {
                                                                                return value.toFixed(2);
                                                                            }
                                                                        }
                                                                    },
                                                                    grid: {
                                                                        borderColor: useColorModeValue("#E2E8F0", "#4A5568"),
                                                                        strokeDashArray: 3,
                                                                        xaxis: {
                                                                            lines: {
                                                                                show: true
                                                                            }
                                                                        },
                                                                        yaxis: {
                                                                            lines: {
                                                                                show: true
                                                                            }
                                                                        },
                                                                        padding: {
                                                                            left: 10,
                                                                            right: 10
                                                                        }
                                                                    },
                                                                    colors: ['#38A169'],
                                                                    tooltip: {
                                                                        theme: useColorModeValue('light', 'dark'),
                                                                        style: {
                                                                            fontSize: '12px',
                                                                            fontFamily: 'inherit'
                                                                        },
                                                                        y: {
                                                                            formatter: function (value) {
                                                                                return value.toFixed(2);
                                                                            },
                                                                            title: {
                                                                                formatter: function () {
                                                                                    return 'القيمة المتوقعة:';
                                                                                }
                                                                            }
                                                                        },
                                                                        x: {
                                                                            formatter: function (value, { dataPointIndex }) {
                                                                                const label = predictionChartData.options.xaxis.categories[dataPointIndex];
                                                                                return `الفترة: ${label}`;
                                                                            }
                                                                        }
                                                                    },
                                                                    responsive: [{
                                                                        breakpoint: 768,
                                                                        options: {
                                                                            chart: {
                                                                                height: 300
                                                                            },
                                                                            dataLabels: {
                                                                                enabled: false
                                                                            },
                                                                            xaxis: {
                                                                                labels: {
                                                                                    style: {
                                                                                        fontSize: '10px'
                                                                                    },
                                                                                    rotate: -45
                                                                                }
                                                                            },
                                                                            yaxis: {
                                                                                labels: {
                                                                                    style: {
                                                                                        fontSize: '10px'
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }]
                                                                }}
                                                                height="400px"
                                                            />
                                                        ) : (
                                                            <LineChart
                                                                chartData={predictionChartData.data}
                                                                chartOptions={{
                                                                    ...predictionChartData.options,
                                                                    chart: {
                                                                        ...predictionChartData.options?.chart,
                                                                        toolbar: {
                                                                            show: true,
                                                                            tools: {
                                                                                download: true,
                                                                                selection: true,
                                                                                zoom: true,
                                                                                zoomin: true,
                                                                                zoomout: true,
                                                                                pan: true,
                                                                                reset: true
                                                                            }
                                                                        },
                                                                        background: 'transparent',
                                                                        foreColor: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                        zoom: {
                                                                            enabled: true,
                                                                            type: 'x',
                                                                            autoScaleYaxis: true
                                                                        }
                                                                    },
                                                                    stroke: {
                                                                        curve: "smooth",
                                                                        width: 3,
                                                                        colors: ['#3182CE'],
                                                                    },
                                                                    markers: {
                                                                        size: 6,
                                                                        colors: ['#3182CE'],
                                                                        strokeColors: cardBg,
                                                                        strokeWidth: 2,
                                                                        hover: {
                                                                            size: 8
                                                                        }
                                                                    },
                                                                    xaxis: {
                                                                        ...predictionChartData.options?.xaxis,
                                                                        categories: predictionChartData.options?.xaxis?.categories || [],
                                                                        title: {
                                                                            text: 'الفترات المستقبلية',
                                                                            style: {
                                                                                color: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '12px',
                                                                                fontWeight: 600
                                                                            }
                                                                        },
                                                                        labels: {
                                                                            style: {
                                                                                colors: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '11px'
                                                                            },
                                                                            rotate: -45, // تدوير التسميات لتوفير مساحة
                                                                            rotateAlways: true,
                                                                            trim: true,
                                                                            maxHeight: 80
                                                                        },
                                                                        tickAmount: undefined,
                                                                        tickPlacement: 'on',
                                                                        axisBorder: {
                                                                            show: true,
                                                                            color: useColorModeValue("#E2E8F0", "#4A5568")
                                                                        },
                                                                        axisTicks: {
                                                                            show: true,
                                                                            color: useColorModeValue("#E2E8F0", "#4A5568")
                                                                        }
                                                                    },
                                                                    yaxis: {
                                                                        ...predictionChartData.options?.yaxis,
                                                                        title: {
                                                                            text: selectedPrediction.metric,
                                                                            style: {
                                                                                color: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '12px',
                                                                                fontWeight: 600
                                                                            }
                                                                        },
                                                                        labels: {
                                                                            style: {
                                                                                colors: useColorModeValue("#2D3748", "#E2E8F0"),
                                                                                fontSize: '11px'
                                                                            },
                                                                            formatter: function (value) {
                                                                                return value.toFixed(2);
                                                                            }
                                                                        }
                                                                    },
                                                                    grid: {
                                                                        borderColor: useColorModeValue("#E2E8F0", "#4A5568"),
                                                                        strokeDashArray: 3,
                                                                        xaxis: {
                                                                            lines: {
                                                                                show: true
                                                                            }
                                                                        },
                                                                        yaxis: {
                                                                            lines: {
                                                                                show: true
                                                                            }
                                                                        },
                                                                        padding: {
                                                                            left: 10,
                                                                            right: 10
                                                                        }
                                                                    },
                                                                    colors: ['#3182CE'],
                                                                    tooltip: {
                                                                        theme: useColorModeValue('light', 'dark'),
                                                                        style: {
                                                                            fontSize: '12px',
                                                                            fontFamily: 'inherit'
                                                                        },
                                                                        y: {
                                                                            formatter: function (value) {
                                                                                return value.toFixed(2);
                                                                            },
                                                                            title: {
                                                                                formatter: function () {
                                                                                    return 'القيمة المتوقعة:';
                                                                                }
                                                                            }
                                                                        },
                                                                        x: {
                                                                            formatter: function (value, { dataPointIndex }) {
                                                                                const label = predictionChartData.options.xaxis.categories[dataPointIndex];
                                                                                return `الفترة: ${label}`;
                                                                            }
                                                                        }
                                                                    },
                                                                    responsive: [{
                                                                        breakpoint: 768,
                                                                        options: {
                                                                            chart: {
                                                                                height: 300
                                                                            },
                                                                            xaxis: {
                                                                                labels: {
                                                                                    style: {
                                                                                        fontSize: '10px'
                                                                                    },
                                                                                    rotate: -45
                                                                                }
                                                                            },
                                                                            yaxis: {
                                                                                labels: {
                                                                                    style: {
                                                                                        fontSize: '10px'
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }]
                                                                }}
                                                                height="400px"
                                                            />
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <Alert status="info" borderRadius="md">
                                                        <AlertIcon />
                                                        <Box>
                                                            <AlertTitle>No prediction data available</AlertTitle>
                                                            <AlertDescription>
                                                                No prediction data found for this prediction.
                                                            </AlertDescription>
                                                        </Box>
                                                    </Alert>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </TabPanel>

                                    <TabPanel>
                                        <Card bg={cardBg}>
                                            <CardHeader>
                                                <Heading as="h2" size="md" color={textColor}>
                                                    Raw Results
                                                </Heading>
                                            </CardHeader>
                                            <CardBody>
                                                {detailsLoading ? (
                                                    <Flex justify="center" py="20px">
                                                        <Spinner size="xl" color="teal.500" />
                                                    </Flex>
                                                ) : predictionDetails ? (
                                                    <Box>
                                                        <Table variant="simple" color={textColor}>
                                                            <Thead>
                                                                <Tr>
                                                                    <Th borderColor={borderColor}>Period</Th>
                                                                    <Th borderColor={borderColor}>Value</Th>
                                                                    <Th borderColor={borderColor}>Type</Th>
                                                                </Tr>
                                                            </Thead>
                                                            <Tbody>
                                                                {predictionDetails.original_values && predictionDetails.original_values.map((item) => (
                                                                    <Tr key={`original-${item.id}`}>
                                                                        <Td borderColor={borderColor}>
                                                                            {new Date(item.period_date).toLocaleDateString()}
                                                                        </Td>
                                                                        <Td borderColor={borderColor}>
                                                                            {item.value}
                                                                        </Td>
                                                                        <Td borderColor={borderColor}>
                                                                            <Badge colorScheme="blue">Original</Badge>
                                                                        </Td>
                                                                    </Tr>
                                                                ))}
                                                                {predictionDetails.raw_results && predictionDetails.raw_results.map((item) => (
                                                                    <Tr key={`prediction-${item.id}`}>
                                                                        <Td borderColor={borderColor}>
                                                                            {new Date(item.period_date).toLocaleDateString()}
                                                                        </Td>
                                                                        <Td borderColor={borderColor}>
                                                                            {item.predicted_value}
                                                                        </Td>
                                                                        <Td borderColor={borderColor}>
                                                                            <Badge colorScheme="green">Predicted</Badge>
                                                                        </Td>
                                                                    </Tr>
                                                                ))}
                                                            </Tbody>
                                                        </Table>
                                                    </Box>
                                                ) : (
                                                    <Alert status="info" borderRadius="md">
                                                        <AlertIcon />
                                                        <Box>
                                                            <AlertTitle>No raw data available</AlertTitle>
                                                            <AlertDescription>
                                                                No raw data found for this prediction.
                                                            </AlertDescription>
                                                        </Box>
                                                    </Alert>
                                                )}
                                            </CardBody>
                                        </Card>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="teal" onClick={closeDetailsModal}>
                            Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Flex>
    );
};

export default Predictions;