// src/views/Dashboard/YearStats/YearStats.js
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
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useHistory, useParams } from "react-router-dom";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import { useAuth } from "contexts/AuthContext";

const YearStats = () => {
    const history = useHistory();
    const { apiRequest } = useAuth();
    const toast = useToast();

    const [yearStats, setYearStats] = useState([]);
    const [filteredYearStats, setFilteredYearStats] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("year");
    const [sortOrder, setSortOrder] = useState("desc");
    const [filterCollege, setFilterCollege] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedYearStat, setSelectedYearStat] = useState(null);

    // Form states
    const [collegeId, setCollegeId] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [annualRevenue, setAnnualRevenue] = useState("");
    const [annualStudents, setAnnualStudents] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const textColor = useColorModeValue("gray.700", "white");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    useEffect(() => {
        fetchColleges();
        fetchYearStats();
    }, []);

    useEffect(() => {
        filterAndSortYearStats();
    }, [yearStats, searchTerm, sortBy, sortOrder, filterCollege]);

    const fetchColleges = async () => {
        try {
            setCollegesLoading(true);
            const response = await apiRequest("/colleges", { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setColleges(result.data);
                } else {
                    throw new Error(result.message || "Failed to fetch colleges");
                }
            } else {
                throw new Error("Failed to fetch colleges");
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

    const fetchYearStats = async () => {
        try {
            setLoading(true);
            const response = await apiRequest("/year-stats", { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setYearStats(result.data);
                } else {
                    throw new Error(result.message || "Failed to fetch year statistics");
                }
            } else {
                throw new Error("Failed to fetch year statistics");
            }
        } catch (error) {
            console.error("Error fetching year statistics:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch year statistics",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortYearStats = () => {
        let filtered = [...yearStats];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(stat =>
                stat.college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                stat.year.toString().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by college
        if (filterCollege) {
            filtered = filtered.filter(stat => stat.college.id === parseInt(filterCollege));
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

        setFilteredYearStats(filtered);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const handleDeleteYearStats = async (id) => {
        if (!window.confirm("Are you sure you want to delete these year statistics?")) {
            return;
        }

        try {
            setDeleteLoading(id);
            const response = await apiRequest(`/year-stats/${id}`, { method: "DELETE" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Year statistics deleted successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchYearStats();
                } else {
                    throw new Error(result.message || "Failed to delete year statistics");
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete year statistics");
            }
        } catch (error) {
            console.error("Error deleting year statistics:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete year statistics",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const getCollegeName = (collegeId) => {
        const college = colleges.find(c => c.id === collegeId);
        return college ? college.name : "Unknown College";
    };

    // Modal handlers
    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openDetailsModal = (yearStat) => {
        setSelectedYearStat(yearStat);
        setIsDetailsModalOpen(true);
    };

    const openEditModal = (yearStat) => {
        setSelectedYearStat(yearStat);
        setCollegeId(yearStat.college_id.toString());
        setYear(yearStat.year);
        setAnnualRevenue(yearStat.annual_revenue.toString());
        setAnnualStudents(yearStat.annual_students.toString());
        setIsEditModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetForm();
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedYearStat(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedYearStat(null);
        resetForm();
    };

    const resetForm = () => {
        setCollegeId("");
        setYear(new Date().getFullYear());
        setAnnualRevenue("");
        setAnnualStudents("");
        setErrors({});
        setHasChanges(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!collegeId) {
            newErrors.collegeId = "College is required";
        }

        if (!year || isNaN(year) || parseInt(year) < 2000 || parseInt(year) > 2100) {
            newErrors.year = "Please enter a valid year between 2000 and 2100";
        }

        if (!annualRevenue || isNaN(annualRevenue) || parseFloat(annualRevenue) < 0) {
            newErrors.annualRevenue = "Annual revenue must be a positive number";
        }

        if (!annualStudents || isNaN(annualStudents) || parseInt(annualStudents) < 0) {
            newErrors.annualStudents = "Annual students must be a positive number";
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

            const yearStatsData = {
                college_id: parseInt(collegeId),
                year: parseInt(year),
                annual_revenue: parseFloat(annualRevenue),
                annual_students: parseInt(annualStudents),
            };

            let response;
            if (isEditModalOpen && selectedYearStat) {
                // Update existing year stats - use PUT
                response = await apiRequest(`/year-stats/${selectedYearStat.id}`, {
                    method: "PUT",
                    body: JSON.stringify(yearStatsData),
                });
            } else {
                // Create new year stats - use POST
                response = await apiRequest(`/colleges/${collegeId}/year-stats`, {
                    method: "POST",
                    body: JSON.stringify(yearStatsData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: isEditModalOpen ? "Year statistics updated successfully" : "Year statistics created successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchYearStats();
                    closeCreateModal();
                    closeEditModal();
                } else {
                    throw new Error(result.message || "Failed to save year statistics");
                }
            } else {
                const result = await response.json();
                if (result.errors) {
                    setErrors(result.errors);
                }
                throw new Error(result.message || "Failed to save year statistics");
            }
        } catch (error) {
            console.error("Error saving year statistics:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save year statistics",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedYearStat) {
            const isChanged =
                collegeId !== selectedYearStat.college_id.toString() ||
                year !== selectedYearStat.year.toString() ||
                annualRevenue !== selectedYearStat.annual_revenue.toString() ||
                annualStudents !== selectedYearStat.annual_students.toString();

            setHasChanges(isChanged);
        }
    }, [collegeId, year, annualRevenue, annualStudents, selectedYearStat]);

    return (
        <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
            <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
                <CardHeader p="6px 0px 22px 0px">
                    <Flex direction="column">
                        <Text fontSize="xl" color={textColor} fontWeight="bold" mb="10px">
                            Year Statistics Management
                        </Text>
                        <Flex justify="space-between" align="center" wrap="wrap" gap="4">
                            <Flex gap="4" width={{ base: "100%", md: "auto" }}>
                                <InputGroup width={{ base: "100%", md: "300px" }}>
                                    <InputLeftElement
                                        pointerEvents="none"
                                        children={<SearchIcon color="gray.300" />}
                                    />
                                    <Input
                                        type="text"
                                        placeholder="Search statistics..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </InputGroup>
                                <Select
                                    placeholder="Filter by college"
                                    value={filterCollege}
                                    onChange={(e) => setFilterCollege(e.target.value)}
                                    width={{ base: "100%", md: "200px" }}
                                >
                                    {colleges.map((college) => (
                                        <option key={college.id} value={college.id}>
                                            {college.name}
                                        </option>
                                    ))}
                                </Select>
                            </Flex>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="teal"
                                onClick={openCreateModal}
                            >
                                Add Year Stats
                            </Button>
                        </Flex>
                    </Flex>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <Flex justify="center" py="20px">
                            <Spinner size="xl" color="teal.500" />
                        </Flex>
                    ) : filteredYearStats.length > 0 ? (
                        <Table variant="simple" color={textColor}>
                            <Thead>
                                <Tr>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("college.name")}>
                                        <Flex align="center">
                                            College
                                            {sortBy === "college.name" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("year")}>
                                        <Flex align="center">
                                            Year
                                            {sortBy === "year" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("annual_revenue")}>
                                        <Flex align="center">
                                            Annual Revenue
                                            {sortBy === "annual_revenue" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("annual_students")}>
                                        <Flex align="center">
                                            Annual Students
                                            {sortBy === "annual_students" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor}>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredYearStats.map((stat) => (
                                    <Tr key={stat.id}>
                                        <Td borderColor={borderColor}>
                                            <Text fontWeight="bold">{stat.college.name}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme="blue">{stat.year}</Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Text>${stat.annual_revenue.toLocaleString()}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Text>{stat.annual_students.toLocaleString()}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <HStack spacing="2">
                                                <IconButton
                                                    aria-label="View year stats"
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    colorScheme="blue"
                                                    onClick={() => openDetailsModal(stat)}
                                                />
                                                <IconButton
                                                    aria-label="Edit year stats"
                                                    icon={<EditIcon />}
                                                    size="sm"
                                                    colorScheme="yellow"
                                                    onClick={() => openEditModal(stat)}
                                                />
                                                <IconButton
                                                    aria-label="Delete year stats"
                                                    icon={<DeleteIcon />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteYearStats(stat.id)}
                                                    isLoading={deleteLoading === stat.id}
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
                            <AlertTitle>No year statistics found!</AlertTitle>
                            <AlertDescription>
                                {searchTerm || filterCollege ? "Try adjusting your search criteria" : "Create your first year statistics to get started"}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardBody>
            </Card>

            {/* Create/Edit Modal */}
            <Modal isOpen={isCreateModalOpen || isEditModalOpen} onClose={isCreateModalOpen ? closeCreateModal : closeEditModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        {isEditModalOpen ? "Edit Year Statistics" : "Create New Year Statistics"}
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
                            <Box mb="6">
                                <FormLabel htmlFor="college">College</FormLabel>
                                <Select
                                    id="college"
                                    placeholder="Select a college"
                                    value={collegeId}
                                    onChange={(e) => setCollegeId(e.target.value)}
                                    isInvalid={errors.collegeId}
                                    isDisabled={collegesLoading}
                                >
                                    {colleges.map((college) => (
                                        <option key={college.id} value={college.id}>
                                            {college.name}
                                        </option>
                                    ))}
                                </Select>
                                {errors.collegeId && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.collegeId}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="year">Year</FormLabel>
                                <Input
                                    id="year"
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    placeholder="Enter year"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)}
                                    isInvalid={errors.year}
                                />
                                {errors.year && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.year}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="annualRevenue">Annual Revenue ($)</FormLabel>
                                <Input
                                    id="annualRevenue"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter annual revenue"
                                    value={annualRevenue}
                                    onChange={(e) => setAnnualRevenue(e.target.value)}
                                    isInvalid={errors.annualRevenue}
                                />
                                {errors.annualRevenue && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.annualRevenue}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="annualStudents">Annual Students</FormLabel>
                                <Input
                                    id="annualStudents"
                                    type="number"
                                    placeholder="Enter annual students"
                                    value={annualStudents}
                                    onChange={(e) => setAnnualStudents(e.target.value)}
                                    isInvalid={errors.annualStudents}
                                />
                                {errors.annualStudents && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.annualStudents}
                                    </Text>
                                )}
                            </Box>
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
                            {isEditModalOpen ? "Update Year Statistics" : "Create Year Statistics"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Year Statistics Details: {selectedYearStat?.college?.name} - {selectedYearStat?.year}
                    </ModalHeader>
                    <ModalBody>
                        {selectedYearStat && (
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Charts</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel>
                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">College</Text>
                                            <Text>{selectedYearStat.college.name}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Year</Text>
                                            <Text>{selectedYearStat.year}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Annual Revenue</Text>
                                            <Text>${selectedYearStat.annual_revenue.toLocaleString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Annual Students</Text>
                                            <Text>{selectedYearStat.annual_students.toLocaleString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Created At</Text>
                                            <Text>{new Date(selectedYearStat.created_at).toLocaleDateString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Last Updated</Text>
                                            <Text>{new Date(selectedYearStat.updated_at).toLocaleDateString()}</Text>
                                        </Box>
                                    </TabPanel>
                                    <TabPanel>
                                        <Text>Charts will be displayed here</Text>
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

export default YearStats;