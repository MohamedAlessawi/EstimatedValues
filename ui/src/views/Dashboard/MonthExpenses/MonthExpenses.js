// src/views/Dashboard/MonthExpenses/MonthExpenses.js
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
} from "@chakra-ui/react";
import { SearchIcon, AddIcon, EditIcon, DeleteIcon, ViewIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { useHistory } from "react-router-dom";
import Card from "components/Card/Card";
import CardBody from "components/Card/CardBody";
import CardHeader from "components/Card/CardHeader";
import { useAuth } from "contexts/AuthContext";

const MonthExpenses = () => {
    const history = useHistory();
    const { apiRequest } = useAuth();
    const toast = useToast();

    const [monthExpenses, setMonthExpenses] = useState([]);
    const [filteredMonthExpenses, setFilteredMonthExpenses] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collegesLoading, setCollegesLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("year");
    const [sortOrder, setSortOrder] = useState("desc");
    const [filterCollege, setFilterCollege] = useState("");
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [deleteLoading, setDeleteLoading] = useState(null);

    // Modal states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMonthExpense, setSelectedMonthExpense] = useState(null);

    // Form states
    const [collegeId, setCollegeId] = useState("");
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
    const [expenses, setExpenses] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [hasChanges, setHasChanges] = useState(false);

    const textColor = useColorModeValue("gray.700", "white");
    const borderColor = useColorModeValue("gray.200", "gray.600");

    useEffect(() => {
        fetchColleges();
        fetchMonthExpenses();
    }, [filterCollege, filterYear]);

    useEffect(() => {
        filterAndSortMonthExpenses();
    }, [monthExpenses, searchTerm, sortBy, sortOrder]);

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

    const fetchMonthExpenses = async () => {
        try {
            setLoading(true);
            let url = "/month-expenses";
            const params = new URLSearchParams();

            if (filterCollege) {
                params.append("college_id", filterCollege);
            }

            if (filterYear) {
                params.append("year", filterYear);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await apiRequest(url, { method: "GET" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setMonthExpenses(result.data);
                } else {
                    throw new Error(result.message || "Failed to fetch month expenses");
                }
            } else {
                throw new Error("Failed to fetch month expenses");
            }
        } catch (error) {
            console.error("Error fetching month expenses:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to fetch month expenses",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortMonthExpenses = () => {
        let filtered = [...monthExpenses];

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(expense =>
                expense.college.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.description.toLowerCase().includes(searchTerm.toLowerCase())
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

        setFilteredMonthExpenses(filtered);
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(field);
            setSortOrder("asc");
        }
    };

    const handleDeleteMonthExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }

        try {
            setDeleteLoading(id);
            const response = await apiRequest(`/month-expenses/${id}`, { method: "DELETE" });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Expense deleted successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchMonthExpenses();
                } else {
                    throw new Error(result.message || "Failed to delete expense");
                }
            } else {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete expense");
            }
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to delete expense",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setDeleteLoading(null);
        }
    };

    const getMonthName = (monthNumber) => {
        const date = new Date();
        date.setMonth(monthNumber - 1);
        return date.toLocaleString('default', { month: 'long' });
    };

    // Modal handlers
    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const openDetailsModal = (expense) => {
        setSelectedMonthExpense(expense);
        setIsDetailsModalOpen(true);
    };

    const openEditModal = (expense) => {
        setSelectedMonthExpense(expense);
        setCollegeId(expense.college_id.toString());
        setYear(expense.year.toString());
        setMonth(expense.month.toString());
        setExpenses(expense.expenses.toString());
        setDescription(expense.description);
        setIsEditModalOpen(true);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetForm();
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedMonthExpense(null);
    };

    const closeEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedMonthExpense(null);
        resetForm();
    };

    const resetForm = () => {
        setCollegeId("");
        setYear(new Date().getFullYear());
        setMonth((new Date().getMonth() + 1).toString());
        setExpenses("");
        setDescription("");
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

        if (!month || isNaN(month) || parseInt(month) < 1 || parseInt(month) > 12) {
            newErrors.month = "Please select a valid month";
        }

        if (!expenses || isNaN(expenses) || parseFloat(expenses) < 0) {
            newErrors.expenses = "Expenses must be a positive number";
        }

        if (!description.trim()) {
            newErrors.description = "Description is required";
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

            const expenseData = {
                college_id: parseInt(collegeId),
                year: parseInt(year),
                month: parseInt(month),
                expenses: parseFloat(expenses),
                description: description.trim(),
            };

            let response;
            if (isEditModalOpen && selectedMonthExpense) {
                // Update existing expense
                response = await apiRequest(`/month-expenses/${selectedMonthExpense.id}`, {
                    method: "PUT",
                    body: JSON.stringify(expenseData),
                });
            } else {
                // Create new expense
                response = await apiRequest(`/colleges/${collegeId}/month-expenses`, {
                    method: "POST",
                    body: JSON.stringify(expenseData),
                });
            }

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: isEditModalOpen ? "Expense updated successfully" : "Expense created successfully",
                        status: "success",
                        duration: 3000,
                        isClosable: true,
                    });
                    fetchMonthExpenses();
                    closeCreateModal();
                    closeEditModal();
                } else {
                    throw new Error(result.message || "Failed to save expense");
                }
            } else {
                const result = await response.json();
                if (result.errors) {
                    setErrors(result.errors);
                }
                throw new Error(result.message || "Failed to save expense");
            }
        } catch (error) {
            console.error("Error saving expense:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save expense",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedMonthExpense) {
            const isChanged =
                collegeId !== selectedMonthExpense.college_id.toString() ||
                year !== selectedMonthExpense.year.toString() ||
                month !== selectedMonthExpense.month.toString() ||
                expenses !== selectedMonthExpense.expenses.toString() ||
                description !== selectedMonthExpense.description;

            setHasChanges(isChanged);
        }
    }, [collegeId, year, month, expenses, description, selectedMonthExpense]);

    return (
        <Flex direction="column" pt={{ base: "120px", md: "75px" }}>
            <Card overflowX={{ sm: "scroll", xl: "hidden" }} pb="0px">
                <CardHeader p="6px 0px 22px 0px">
                    <Flex direction="column">
                        <Text fontSize="xl" color={textColor} fontWeight="bold" mb="10px">
                            Monthly Expenses Management
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
                                        placeholder="Search expenses..."
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
                                <Select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    width={{ base: "100%", md: "120px" }}
                                >
                                    {[...Array(10)].map((_, i) => {
                                        const year = new Date().getFullYear() - i;
                                        return (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        );
                                    })}
                                </Select>
                            </Flex>
                            <Button
                                leftIcon={<AddIcon />}
                                colorScheme="teal"
                                onClick={openCreateModal}
                            >
                                Add Expense
                            </Button>
                        </Flex>
                    </Flex>
                </CardHeader>
                <CardBody>
                    {loading ? (
                        <Flex justify="center" py="20px">
                            <Spinner size="xl" color="teal.500" />
                        </Flex>
                    ) : filteredMonthExpenses.length > 0 ? (
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
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("month")}>
                                        <Flex align="center">
                                            Month
                                            {sortBy === "month" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor} cursor="pointer" onClick={() => handleSort("expenses")}>
                                        <Flex align="center">
                                            Expenses
                                            {sortBy === "expenses" && (
                                                <Icon ml="1" as={sortOrder === "asc" ? ChevronDownIcon : ChevronDownIcon} transform={sortOrder === "desc" ? "rotate(180deg)" : ""} />
                                            )}
                                        </Flex>
                                    </Th>
                                    <Th borderColor={borderColor}>Description</Th>
                                    <Th borderColor={borderColor}>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {filteredMonthExpenses.map((expense) => (
                                    <Tr key={expense.id}>
                                        <Td borderColor={borderColor}>
                                            <Text fontWeight="bold">{expense.college.name}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme="blue">{expense.year}</Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Badge colorScheme="green">{getMonthName(expense.month)}</Badge>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <Text>${expense.expenses.toLocaleString()}</Text>
                                        </Td>
                                        <Td borderColor={borderColor} maxWidth="200px" isTruncated>
                                            <Text>{expense.description}</Text>
                                        </Td>
                                        <Td borderColor={borderColor}>
                                            <HStack spacing="2">
                                                <IconButton
                                                    aria-label="View expense"
                                                    icon={<ViewIcon />}
                                                    size="sm"
                                                    colorScheme="blue"
                                                    onClick={() => openDetailsModal(expense)}
                                                />
                                                <IconButton
                                                    aria-label="Edit expense"
                                                    icon={<EditIcon />}
                                                    size="sm"
                                                    colorScheme="yellow"
                                                    onClick={() => openEditModal(expense)}
                                                />
                                                <IconButton
                                                    aria-label="Delete expense"
                                                    icon={<DeleteIcon />}
                                                    size="sm"
                                                    colorScheme="red"
                                                    onClick={() => handleDeleteMonthExpense(expense.id)}
                                                    isLoading={deleteLoading === expense.id}
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
                            <AlertTitle>No expenses found!</AlertTitle>
                            <AlertDescription>
                                {searchTerm || filterCollege || filterYear ? "Try adjusting your search criteria" : "Create your first expense to get started"}
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
                        {isEditModalOpen ? "Edit Monthly Expense" : "Create New Monthly Expense"}
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

                            <Flex gap="4" mb="6">
                                <Box flex="1">
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

                                <Box flex="1">
                                    <FormLabel htmlFor="month">Month</FormLabel>
                                    <Select
                                        id="month"
                                        placeholder="Select month"
                                        value={month}
                                        onChange={(e) => setMonth(e.target.value)}
                                        isInvalid={errors.month}
                                    >
                                        <option value="1">January</option>
                                        <option value="2">February</option>
                                        <option value="3">March</option>
                                        <option value="4">April</option>
                                        <option value="5">May</option>
                                        <option value="6">June</option>
                                        <option value="7">July</option>
                                        <option value="8">August</option>
                                        <option value="9">September</option>
                                        <option value="10">October</option>
                                        <option value="11">November</option>
                                        <option value="12">December</option>
                                    </Select>
                                    {errors.month && (
                                        <Text color="red.500" fontSize="sm" mt="1">
                                            {errors.month}
                                        </Text>
                                    )}
                                </Box>
                            </Flex>

                            <Box mb="6">
                                <FormLabel htmlFor="expenses">Expenses ($)</FormLabel>
                                <Input
                                    id="expenses"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter expenses amount"
                                    value={expenses}
                                    onChange={(e) => setExpenses(e.target.value)}
                                    isInvalid={errors.expenses}
                                />
                                {errors.expenses && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.expenses}
                                    </Text>
                                )}
                            </Box>

                            <Box mb="6">
                                <FormLabel htmlFor="description">Description</FormLabel>
                                <Textarea
                                    id="description"
                                    placeholder="Enter expense description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    isInvalid={errors.description}
                                    rows={4}
                                />
                                {errors.description && (
                                    <Text color="red.500" fontSize="sm" mt="1">
                                        {errors.description}
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
                            {isEditModalOpen ? "Update Expense" : "Create Expense"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Details Modal */}
            <Modal isOpen={isDetailsModalOpen} onClose={closeDetailsModal} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Expense Details: {selectedMonthExpense?.college?.name} - {selectedMonthExpense && getMonthName(selectedMonthExpense.month)} {selectedMonthExpense?.year}
                    </ModalHeader>
                    <ModalBody>
                        {selectedMonthExpense && (
                            <Tabs>
                                <TabList>
                                    <Tab>Overview</Tab>
                                    <Tab>Charts</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel>
                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">College</Text>
                                            <Text>{selectedMonthExpense.college.name}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Period</Text>
                                            <Flex gap="2">
                                                <Badge colorScheme="blue">{selectedMonthExpense.year}</Badge>
                                                <Badge colorScheme="green">{getMonthName(selectedMonthExpense.month)}</Badge>
                                            </Flex>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Amount</Text>
                                            <Text fontSize="xl" fontWeight="bold" color="teal.500">
                                                ${selectedMonthExpense.expenses.toLocaleString()}
                                            </Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Description</Text>
                                            <Text>{selectedMonthExpense.description}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Created At</Text>
                                            <Text>{new Date(selectedMonthExpense.created_at).toLocaleDateString()}</Text>
                                        </Box>

                                        <Box mb="4">
                                            <Text fontWeight="bold" mb="2">Last Updated</Text>
                                            <Text>{new Date(selectedMonthExpense.updated_at).toLocaleDateString()}</Text>
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

export default MonthExpenses;