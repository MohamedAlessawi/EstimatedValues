// src/views/Dashboard/Colleges/Colleges.js
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
    Progress,
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

const Colleges = () => {
    const history = useHistory();
    const { apiRequest } = useAuth();
    const toast = useToast();

    const [colleges, setColleges] = useState([]);
    const [filteredColleges, setFilteredColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const [sortOrder, setSortOrder] = useState("asc");
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedCollege, setSelectedCollege] = useState(null);

    // Form states
    const [name, setName] = useState("");
    const [maxStudents, setMaxStudents] = useState("");
    const [maxRevenue, setMaxRevenue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const textColor = useColorModeValue("gray.700", "white");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    useEffect(() => {
        fetchColleges();
    }, []);

    useEffect(() => {
        filterAndSortColleges();
    }, [colleges, searchTerm, sortBy, sortOrder]);

    const fetchColleges = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    const filterAndSortColleges = () => {
        let filtered = [...colleges];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(college =>
                college.name.toLowerCase().includes(searchTerm.toLowerCase())
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

        setFilteredColleges(filtered);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const handleDeleteCollege = async (id) => {
        if (!window.confirm("Are you sure you want to delete this college?")) {
            return;
        }

        try {
            setDeleteLoading(id);
            const response = await apiRequest(`/colleges/${id}`, { method: "DELETE" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "College deleted successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchColleges();
                } else {
                    throw new Error(result.message || "Failed to delete college");
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete college");
            }
        } catch (error) {
            console.error("Error deleting college:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete college",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const getCapacityPercentage = (current, max) => {
        return Math.min((current / max) * 100, 100);
    };

    const getRevenuePercentage = (current, max) => {
        return Math.min((current / max) * 100, 100);
    };

    // Modal handlers
    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openDetailsModal = (college) => {
        setSelectedCollege(college);
        setIsDetailsModalOpen(true);
    };

    const openEditModal = (college) => {
        setSelectedCollege(college);
        setName(college.name);
        setMaxStudents(college.max_students_capacity.toString());
        setMaxRevenue(college.max_annual_revenue.toString());
        setIsEditModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetForm();
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedCollege(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedCollege(null);
        resetForm();
    };

    const resetForm = () => {
        setName("");
        setMaxStudents("");
        setMaxRevenue("");
        setErrors({});
        setHasChanges(false);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!name.trim()) {
            newErrors.name = "College name is required";
        }

        if (!maxStudents || isNaN(maxStudents) || parseInt(maxStudents) <= 0) {
            newErrors.maxStudents = "Max students must be a positive number";
        }

        if (!maxRevenue || isNaN(maxRevenue) || parseFloat(maxRevenue) <= 0) {
            newErrors.maxRevenue = "Max annual revenue must be a positive number";
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

            const collegeData = {
                name: name.trim(),
                max_students_capacity: parseInt(maxStudents),
                max_annual_revenue: parseFloat(maxRevenue),
            };

            let response;
            if (isEditModalOpen && selectedCollege) {
                // Update existing college
                response = await apiRequest(`/colleges/${selectedCollege.id}`, {
                    method: "PUT",
                    body: JSON.stringify(collegeData),
                });
            } else {
                // Create new college
                response = await apiRequest("/colleges", {
                    method: "POST",
                    body: JSON.stringify(collegeData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: isEditModalOpen ? "College updated successfully" : "College created successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchColleges();
                    closeCreateModal();
                    closeEditModal();
                } else {
                    throw new Error(result.message || "Failed to save college");
                }
            } else {
                const result = await response.json();
                if (result.errors) {
                    setErrors(result.errors);
                }
                throw new Error(result.message || "Failed to save college");
            }
        } catch (error) {
            console.error("Error saving college:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save college",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCollege) {
            const isChanged =
                name !== selectedCollege.name ||
                maxStudents !== selectedCollege.max_students_capacity.toString() ||
                maxRevenue !== selectedCollege.max_annual_revenue.toString();

            setHasChanges(isChanged);
        }
    }, [name, maxStudents, maxRevenue, selectedCollege]);

    return (
        <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
            <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
                <CardHeader p="6px 0px 22px 0px">
                    <Flex direction="column">
                        <Text fontSize="xl" color={textColor} fontWeight="bold" mb="10px">
                            Colleges Management
                        </Text>
                        <Flex justify="space-between" align="center">
                            <InputGroup width={{ base: "100%", md: "300px" }}>
                                <InputLeftElement
                                    pointerEvents="none"
                                    children={<SearchIcon color="gray.300" />}
                                />
                                <Input
                                    type="text"
                                    placeholder="Search colleges..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="teal"
                                onClick={openCreateModal}
                            >
                                Add College
                            </Button>
                        </Flex>
                    </Flex>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <Flex justify="center" py="20px">
                            <Spinner size="xl" color="teal.500" />
                        </Flex>
                    ) : filteredColleges.length > 0 ? (
                        <Table variant="simple" color={textColor}>
                            <Thead>
                                <Tr>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("name")}>
                                        <Flex align="center">
                                            Name
                                            {sortBy === "name" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("max_students_capacity")}>
                                        <Flex align="center">
                                            Max Students
                                            {sortBy === "max_students_capacity" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("max_annual_revenue")}>
                                        <Flex align="center">
                                            Max Revenue
                                            {sortBy === "max_annual_revenue" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor}>Created At</Th>
                                    <Th borderColor={borderColor}>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredColleges.map((college) => (
                                    <Tr key={college.id}>
                                        <Td borderColor={borderColor}>
                                            <Text fontWeight="bold">{college.name}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Flex direction="column">
                                                <Text>{college.max_students_capacity} students</Text>
                                                <Progress
                                                    colorScheme="blue"
                                                    size="xs"
                                                    mt="1"
                                                    value={getCapacityPercentage(college.current_students || 0, college.max_students_capacity)}
                                                    borderRadius="md"
                                                />
                                            </Flex>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Flex direction="column">
                                                <Text>${college.max_annual_revenue.toLocaleString()}</Text>
                                                <Progress
                                                    colorScheme="green"
                                                    size="xs"
                                                    mt="1"
                                                    value={getRevenuePercentage(college.current_annual_revenue || 0, college.max_annual_revenue)}
                                                    borderRadius="md"
                                                />
                                            </Flex>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            {new Date(college.created_at).toLocaleDateString()}
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <HStack spacing="2">
                                                <IconButton
                                                    aria-label="View college"
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    colorScheme="blue"
                                                    onClick={() => openDetailsModal(college)}
                                                />
                                                <IconButton
                                                    aria-label="Edit college"
                                                    icon={<EditIcon />}
                                                    size="sm"
                                                    colorScheme="yellow"
                                                    onClick={() => openEditModal(college)}
                                                />
                                                <IconButton
                                                    aria-label="Delete college"
                                                    icon={<DeleteIcon />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteCollege(college.id)}
                                                    isLoading={deleteLoading === college.id}
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
                            <AlertTitle>No colleges found!</AlertTitle>
                            <AlertDescription>
                                {searchTerm ? "Try adjusting your search criteria" : "Create your first college to get started"}
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
                        {isEditModalOpen ? "Edit College" : "Create New College"}
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
                                <FormLabel htmlFor="name">College Name</FormLabel>
                                <Input
                                    id="name"
                                    placeholder="Enter college name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    isInvalid={errors.name}
                                />
                                {errors.name && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.name}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="maxStudents">Max Students Capacity</FormLabel>
                                <Input
                                    id="maxStudents"
                                    type="number"
                                    placeholder="Enter max students capacity"
                                    value={maxStudents}
                                    onChange={(e) => setMaxStudents(e.target.value)}
                                    isInvalid={errors.maxStudents}
                                />
                                {errors.maxStudents && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.maxStudents}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="maxRevenue">Max Annual Revenue ($)</FormLabel>
                                <Input
                                    id="maxRevenue"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter max annual revenue"
                                    value={maxRevenue}
                                    onChange={(e) => setMaxRevenue(e.target.value)}
                                    isInvalid={errors.maxRevenue}
                                />
                                {errors.maxRevenue && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.maxRevenue}
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
                            {isEditModalOpen ? "Update College" : "Create College"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        College Details: {selectedCollege?.name}
                    </ModalHeader>
                    <ModalBody>
                        {selectedCollege && (
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Statistics</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel>
                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">College Name</Text>
                                            <Text>{selectedCollege.name}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Max Students Capacity</Text>
                                            <Text>{selectedCollege.max_students_capacity}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Max Annual Revenue</Text>
                                            <Text>${selectedCollege.max_annual_revenue.toLocaleString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Created At</Text>
                                            <Text>{new Date(selectedCollege.created_at).toLocaleDateString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Last Updated</Text>
                                            <Text>{new Date(selectedCollege.updated_at).toLocaleDateString()}</Text>
                                        </Box>
                                    </TabPanel>
                                    <TabPanel>
                                        <Text>Statistics data will be displayed here</Text>
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

export default Colleges;