// src/contexts/AuthContext.js - مخصص لـ /api/refresh-token
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // دالة مساعدة لاستخراج الكوكي
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
  };

  // تهيئة CSRF token
  const initializeCsrf = async () => {
    try {
      await fetch('http://localhost:8000/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include'
      });
      return true;
    } catch (error) {
      console.error('CSRF init failed:', error);
      return false;
    }
  };

  // ✅ دالة لتجديد access token باستخدام refresh token - مخصصة لـ /api/refresh-token
  const refreshAccessToken = async () => {
    try {
      const currentRefreshToken = localStorage.getItem('refresh_token');
      if (!currentRefreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('🔄 Attempting to refresh token...');

      await initializeCsrf();
      const csrfToken = getCookie('XSRF-TOKEN');

      // استخدام endpoint الـ refresh-token المخصص لديك
      const response = await fetch('http://localhost:8000/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          refresh_token: currentRefreshToken
        }),
      });

      console.log('📨 Refresh token response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Token refresh successful:', result);
        
        if (result.success) {
          const { access_token, refresh_token } = result.data;
          
          // حفظ التوكنز الجديدة
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          console.log('✅ New tokens saved successfully');
          return access_token;
        } else {
          throw new Error(result.message || 'Token refresh failed');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Refresh token failed:', errorText);
        throw new Error(`Token refresh failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      // إذا فشل التجديد، نخرج المستخدم
      logout();
      throw error;
    }
  };

  // ✅ دالة محسنة لطلبات API مع تجديد تلقائي للـ token
  const apiRequest = async (url, options = {}) => {
    try {
      let currentToken = accessToken || localStorage.getItem('access_token');
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      };

      // إضافة الـ token إذا كان موجوداً
      if (currentToken) {
        config.headers['Authorization'] = `Bearer ${currentToken}`;
      }

      // إضافة CSRF token للطلبات غير GET
      if (options.method && options.method !== 'GET') {
        await initializeCsrf();
        const csrfToken = getCookie('XSRF-TOKEN');
        if (csrfToken) {
          config.headers['X-XSRF-TOKEN'] = csrfToken;
        }
      }

      console.log(`📤 Making API request to: ${url}`);
      let response = await fetch(`http://localhost:8000/api${url}`, config);

      // إذا كان الـ token منتهي الصلاحية (401)، نحاول تجديده
      if (response.status === 401 && currentToken) {
        console.log('🔄 Token expired, attempting refresh...');
        try {
          const newToken = await refreshAccessToken();
          
          // إعادة الطلب مع الـ token الجديد
          config.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`http://localhost:8000/api${url}`, config);
          console.log('✅ Request retried with new token');
        } catch (refreshError) {
          console.error('❌ Token refresh failed, redirecting to login');
          // إذا فشل التجديد، نرمي خطأ لتوجيه المستخدم لتسجيل الدخول
          throw new Error('SESSION_EXPIRED');
        }
      }

      return response;
    } catch (error) {
      console.error('API request error:', error);
      
      // إذا كان الخطأ بسبب انتهاء الجلسة، نوجه المستخدم
      if (error.message === 'SESSION_EXPIRED') {
        toast({
          title: "انتهت الجلسة",
          description: "يرجى تسجيل الدخول مرة أخرى",
          status: "warning",
          duration: 5000,
        });
      }
      
      throw error;
    }
  };

  // ✅ دالة لجلب بيانات المستخدم باستخدام apiRequest المحسنة
 const fetchUserData = async () => {
  try {
    const response = await apiRequest('/user', { method: 'GET' });
    
    if (response.ok) {
      const result = await response.json();
      setUser(result.data);
      console.log('✅ User data fetched:', result.data);
      return result.data;
    } else {
      console.error('❌ Failed to fetch user data:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
};

  useEffect(() => {
    const initializeAuth = async () => {
      await initializeCsrf();
      
      const storedAccessToken = localStorage.getItem('access_token');
      const storedRefreshToken = localStorage.getItem('refresh_token');
      
      console.log('🔍 Initializing auth with tokens:', {
        accessToken: storedAccessToken ? 'exists' : 'missing',
        refreshToken: storedRefreshToken ? 'exists' : 'missing'
      });

      if (storedAccessToken && storedRefreshToken) {
        setAccessToken(storedAccessToken);
        setRefreshToken(storedRefreshToken);
        
        // جلب بيانات المستخدم عند التهيئة
        await fetchUserData();
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // ✅ تحديث دالة login
  const login = async (loginData) => {
    try {
      console.log('🚀 Starting login process...');

      await initializeCsrf();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const csrfToken = getCookie('XSRF-TOKEN');
      if (!csrfToken) {
        throw new Error('CSRF token not available');
      }

      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(loginData),
      });

      console.log('📨 Login response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Login successful:', result);
        
        if (result.success) {
          const { access_token, refresh_token } = result.data;
          
          // حفظ كلا التوكنز
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          console.log('💾 Tokens saved to localStorage');
          
          // جلب بيانات المستخدم
          await fetchUserData();
          
          toast({
            title: "تم تسجيل الدخول بنجاح",
            status: "success",
            duration: 3000,
          });
          
          return { success: true };
        }
      }
      
      const errorText = await response.text();
      console.error('❌ Login failed:', errorText);
      throw new Error(errorText);
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message,
        status: "error",
        duration: 5000,
      });
      return { success: false, error: error.message };
    }
  };

  // ✅ تحديث دالة register
  const register = async (userData) => {
    try {
      console.log('🚀 Starting registration process...');

      await initializeCsrf();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const csrfToken = getCookie('XSRF-TOKEN');
      if (!csrfToken) {
        throw new Error('CSRF token not available');
      }

      const formData = new FormData();
      formData.append('full_name', userData.full_name);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('password', userData.password);
      formData.append('password_confirmation', userData.password_confirmation);
      
      if (userData.profile_photo) {
        formData.append('profile_photo', userData.profile_photo);
      }

      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-XSRF-TOKEN': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      console.log('📨 Registration response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Registration successful:', result);
        
        if (result.success) {
          const { access_token, refresh_token } = result.data;
          
          // حفظ كلا التوكنز
          setAccessToken(access_token);
          setRefreshToken(refresh_token);
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);
          
          console.log('💾 Registration tokens saved');
          
          // جلب بيانات المستخدم
          await fetchUserData();
          
          toast({
            title: "تم إنشاء الحساب بنجاح",
            description: "تم تسجيل الدخول تلقائياً",
            status: "success",
            duration: 3000,
          });
          
          return { success: true, data: result.data };
        }
      }
      
      const errorText = await response.text();
      console.error('❌ Registration failed:', errorText);
      
      let errorMessage = "فشل إنشاء الحساب";
      try {
        const errorResult = JSON.parse(errorText);
        errorMessage = errorResult.message || errorMessage;
        
        if (errorResult.errors) {
          const errorDetails = Object.values(errorResult.errors).flat().join(', ');
          errorMessage += `: ${errorDetails}`;
        }
      } catch {
        // إذا لم يكن JSON، استخدم النص كما هو
      }
      
      throw new Error(errorMessage);
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      toast({
        title: "فشل إنشاء الحساب",
        description: error.message,
        status: "error",
        duration: 5000,
      });
      return { success: false, error: error.message };
    }
  };
  // src/contexts/AuthContext.js - Add these functions to the existing AuthContext

  // Colleges API functions
  const getColleges = async () => {
    try {
      const response = await apiRequest('/colleges');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching colleges:', error);
      throw error;
    }
  };

  const getCollege = async (id) => {
    try {
      const response = await apiRequest(`/colleges/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching college:', error);
      throw error;
    }
  };

  const createCollege = async (collegeData) => {
    try {
      const response = await apiRequest('/colleges', {
        method: 'POST',
        body: JSON.stringify(collegeData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating college:', error);
      throw error;
    }
  };

  const updateCollege = async (id, collegeData) => {
    try {
      const response = await apiRequest(`/colleges/${id}`, {
        method: 'PUT',
        body: JSON.stringify(collegeData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating college:', error);
      throw error;
    }
  };

  const deleteCollege = async (id) => {
    try {
      const response = await apiRequest(`/colleges/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting college:', error);
      throw error;
    }
  };

  // Year Stats API functions
  const getYearStats = async (collegeId) => {
    try {
      const response = await apiRequest(`/year-stats?college_id=${collegeId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching year stats:', error);
      throw error;
    }
  };

  const getYearStat = async (id) => {
    try {
      const response = await apiRequest(`/year-stats/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching year stat:', error);
      throw error;
    }
  };

  const createYearStat = async (yearStatData) => {
    try {
      const response = await apiRequest('/year-stats', {
        method: 'POST',
        body: JSON.stringify(yearStatData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating year stat:', error);
      throw error;
    }
  };

  const updateYearStat = async (id, yearStatData) => {
    try {
      const response = await apiRequest(`/year-stats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(yearStatData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating year stat:', error);
      throw error;
    }
  };

  const deleteYearStat = async (id) => {
    try {
      const response = await apiRequest(`/year-stats/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting year stat:', error);
      throw error;
    }
  };

  // Month Expenses API functions
  const getMonthExpenses = async (collegeId, year) => {
    try {
      const response = await apiRequest(`/month-expenses?college_id=${collegeId}&year=${year}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching month expenses:', error);
      throw error;
    }
  };

  const getMonthExpense = async (id) => {
    try {
      const response = await apiRequest(`/month-expenses/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching month expense:', error);
      throw error;
    }
  };

  const createMonthExpense = async (monthExpenseData) => {
    try {
      const response = await apiRequest('/month-expenses', {
        method: 'POST',
        body: JSON.stringify(monthExpenseData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating month expense:', error);
      throw error;
    }
  };

  const updateMonthExpense = async (id, monthExpenseData) => {
    try {
      const response = await apiRequest(`/month-expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(monthExpenseData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating month expense:', error);
      throw error;
    }
  };

  const deleteMonthExpense = async (id) => {
    try {
      const response = await apiRequest(`/month-expenses/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting month expense:', error);
      throw error;
    }
  };

  // Prediction API functions
  const createPrediction = async (predictionData) => {
    try {
      const response = await apiRequest('/predict', {
        method: 'POST',
        body: JSON.stringify(predictionData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating prediction:', error);
      throw error;
    }
  };

  const getPredictionHistory = async () => {
    try {
      const response = await apiRequest('/predict/history');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      throw error;
    }
  };

  const getPrediction = async (id) => {
    try {
      const response = await apiRequest(`/predict/history/${id}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prediction:', error);
      throw error;
    }
  };

  const updatePrediction = async (id, predictionData) => {
    try {
      const response = await apiRequest(`/predict/history/${id}`, {
        method: 'PUT',
        body: JSON.stringify(predictionData),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating prediction:', error);
      throw error;
    }
  };

  const deletePrediction = async (id) => {
    try {
      const response = await apiRequest(`/predict/history/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error deleting prediction:', error);
      throw error;
    }
  };

  const getPredictionPeriods = async (scopeType, scopeId, metric, periodType) => {
    try {
      const response = await apiRequest(`/predict/periods?scope_type=${scopeType}&scope_id=${scopeId}&metric=${metric}&period_type=${periodType}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching prediction periods:', error);
      throw error;
    }
  };

  // Add these new functions to the value object in the AuthContext

  // ✅ تحديث دالة logout
  const logout = async () => {
    try {
      // إرسال طلب logout إلى الخادم إذا كان هناك token
      if (accessToken) {
        await apiRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // تنظيف البيانات المحلية في جميع الأحوال
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      console.log('🧹 All auth data cleared');

      toast({
        title: "تم تسجيل الخروج",
        status: "info",
        duration: 3000,
      });
    }
  };

  // ✅ دالة لفحص حالة التوكن
  const checkTokenValidity = async () => {
    try {
      const response = await apiRequest('/user', { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const value = {
    accessToken,
    refreshToken,
    user,
    login,
    logout,
    register,
    apiRequest,
    checkTokenValidity,
    refreshAccessToken,
    isAuthenticated: !!accessToken,
    loading,
    // Colleges API functions
    getColleges,
    getCollege,
    createCollege,
    updateCollege,
    deleteCollege,
    // Year Stats API functions
    getYearStats,
    getYearStat,
    createYearStat,
    updateYearStat,
    deleteYearStat,
    // Month Expenses API functions
    getMonthExpenses,
    getMonthExpense,
    createMonthExpense,
    updateMonthExpense,
    deleteMonthExpense,
    // Prediction API functions
    createPrediction,
    getPredictionHistory,
    getPrediction,
    updatePrediction,
    deletePrediction,
    getPredictionPeriods,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};