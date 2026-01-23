// Chakra imports
import { 
  Flex, 
  Grid, 
  useColorModeValue, 
  Spinner, 
  Center, 
  Text,
  Button,
  useToast 
} from "@chakra-ui/react";
import avatar4 from "assets/img/avatars/avatar4.png";
import ProfileBgImage from "assets/img/ProfileBackground.png";
import React, { useEffect, useState } from "react";
import { FaCube, FaPenFancy } from "react-icons/fa";
import { IoDocumentsSharp } from "react-icons/io5";
import Conversations from "./components/Conversations";
import Header from "./components/Header";
import PlatformSettings from "./components/PlatformSettings";
import ProfileInformation from "./components/ProfileInformation";
import Projects from "./components/Projects";
import { useAuth } from "contexts/AuthContext";
import { useHistory } from "react-router-dom";

function Profile() {
  // Chakra color mode
  const textColor = useColorModeValue("gray.700", "white");
  const bgProfile = useColorModeValue(
    "hsla(0,0%,100%,.8)",
    "linear-gradient(112.83deg, rgba(255, 255, 255, 0.21) 0%, rgba(255, 255, 255, 0) 110.84%)"
  );

  const { user, apiRequest, loading, isAuthenticated, logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  const history = useHistory();
  const toast = useToast();

  // دالة مساعدة للتحقق من التوكن
  const checkToken = () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    console.log('🔍 Token check:', {
      accessToken: accessToken ? 'exists' : 'missing',
      refreshToken: refreshToken ? 'exists' : 'missing',
      isAuthenticated
    });

    return accessToken && refreshToken;
  };

  // جلب بيانات المستخدم مع معالجة هيكل الـ response المختلف
  const fetchUserData = async () => {
    try {
      setProfileLoading(true);
      setFetchError(null);
      
      // التحقق من وجود التوكن أولاً
      if (!checkToken()) {
        setFetchError("لم يتم العثور على رمز الدخول. يرجى تسجيل الدخول مرة أخرى.");
        toast({
          title: "جلسة منتهية",
          description: "يرجى تسجيل الدخول مرة أخرى",
          status: "warning",
          duration: 5000,
        });
        setTimeout(() => {
          history.push("/auth/signin");
        }, 2000);
        return;
      }

      console.log("🔄 Fetching user data from profile page...");
      
      // استخدام apiRequest التي تدير التوكن تلقائياً
      const response = await apiRequest("/user", { method: "GET" });
      
      console.log("📨 User data response status:", response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log("✅ Full API response:", result);
        
        // 🔥 تصحيح هيكل البيانات - الـ response قد يكون مختلفاً
        let userDataFromResponse;
        
        if (result.data) {
          // إذا كان الهيكل: { success: true, data: { ... } }
          userDataFromResponse = result.data;
        } else if (result.id) {
          // إذا كان الهيكل: { id: 3, full_name: "...", ... } مباشرة
          userDataFromResponse = result;
        } else if (result.user) {
          // إذا كان الهيكل: { success: true, user: { ... } }
          userDataFromResponse = result.user;
        } else {
          // إذا كان هناك هيكل آخر
          console.warn("⚠️ Unknown response structure:", result);
          userDataFromResponse = result;
        }
        
        console.log("✅ Extracted user data:", userDataFromResponse);
        
        if (userDataFromResponse && (userDataFromResponse.id || userDataFromResponse.email)) {
          setUserData(userDataFromResponse);
          
          toast({
            title: "تم تحميل البيانات",
            description: "تم جلب بيانات الملف الشخصي بنجاح",
            status: "success",
            duration: 3000,
          });
        } else {
          throw new Error("بيانات المستخدم غير صالحة في الرد");
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Failed to fetch user data:", response.status, errorText);
        
        if (response.status === 401) {
          setFetchError("انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.");
          toast({
            title: "انتهت الجلسة",
            description: "يرجى تسجيل الدخول مرة أخرى",
            status: "warning",
            duration: 5000,
          });
          setTimeout(() => {
            history.push("/auth/signin");
          }, 2000);
        } else if (response.status === 500) {
          setFetchError("خطأ في الخادم. يرجى المحاولة لاحقاً.");
        } else {
          setFetchError("فشل في جلب بيانات المستخدم: " + response.status);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching user data:", error);
      
      if (error.message === 'SESSION_EXPIRED') {
        setFetchError("انتهت جلستك. يتم توجيهك إلى صفحة تسجيل الدخول...");
        setTimeout(() => {
          history.push("/auth/signin");
        }, 2000);
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        setFetchError("تعذر الاتصال بالخادم. تأكد من تشغيل الخادم المحلي.");
      } else {
        setFetchError("حدث خطأ أثناء جلب البيانات: " + error.message);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  // جلب بيانات المستخدم عند تحميل المكون
  useEffect(() => {
    console.log("🏁 Profile component mounted");
    console.log("🔐 Auth state:", { isAuthenticated, user, loading });

    // إذا كانت بيانات المستخدم موجودة في context، استخدمها
    if (user) {
      console.log("✅ Using user data from context:", user);
      setUserData(user);
      setProfileLoading(false);
      return;
    }

    // إذا كان المستخدم غير مسجل دخول، تحقق من التوكن
    if (!isAuthenticated) {
      console.log("🚫 User not authenticated, checking tokens...");
      
      const hasTokens = checkToken();
      if (!hasTokens) {
        console.log("🚫 No tokens found, redirecting to login...");
        toast({
          title: "غير مسجل دخول",
          description: "يرجى تسجيل الدخول أولاً",
          status: "info",
          duration: 3000,
        });
        history.push("/auth/signin");
        return;
      }
    }

    // جلب البيانات من API
    console.log("🔄 Fetching user data on component mount...");
    fetchUserData();
  }, [user, isAuthenticated, history]);

  // إعادة محاولة جلب البيانات
  const handleRetry = () => {
    console.log("🔄 Retrying user data fetch...");
    fetchUserData();
  };

  // تسجيل الخروج
  const handleLogout = () => {
    console.log("🚪 Logging out from profile page...");
    logout();
    history.push("/auth/signin");
  };

  // عرض loading أثناء جلب البيانات
  if (loading || profileLoading) {
    return (
      <Center h="50vh">
        <Flex direction="column" align="center">
          <Spinner size="xl" color="teal.500" />
          <Text mt={4} color={textColor}>
            جاري تحميل بيانات الملف الشخصي...
          </Text>
        </Flex>
      </Center>
    );
  }

  // إذا كان هناك خطأ في جلب البيانات
  if (fetchError) {
    return (
      <Center h="50vh">
        <Flex direction="column" align="center" textAlign="center" maxW="400px">
          <Text color="red.500" mb={4} fontSize="lg">
            {fetchError}
          </Text>
          <Flex gap={3}>
            <Button colorScheme="teal" onClick={handleRetry}>
              إعادة المحاولة
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              تسجيل الدخول مرة أخرى
            </Button>
          </Flex>
        </Flex>
      </Center>
    );
  }

  // إذا لم توجد بيانات المستخدم
  if (!userData) {
    return (
      <Center h="50vh">
        <Flex direction="column" align="center">
          <Text color={textColor} mb={4}>
            تعذر تحميل بيانات المستخدم
          </Text>
          <Flex gap={3}>
            <Button colorScheme="teal" onClick={handleRetry}>
              إعادة المحاولة
            </Button>
            <Button variant="outline" onClick={() => history.push("/admin/dashboard")}>
              العودة للرئيسية
            </Button>
          </Flex>
        </Flex>
      </Center>
    );
  }

  // عرض صفحة البروفايل مع البيانات
  console.log(" Rendering profile with user data:", userData);
  return (
    <Flex direction='column'>
      <Header
        backgroundHeader={ProfileBgImage}
        backgroundProfile={bgProfile}
        avatarImage={userData.profile_photo || avatar4}
        name={userData.full_name || "مستخدم"}
        email={userData.email || "لا يوجد بريد إلكتروني"}
        tabs={[
          {
            name: "",
            icon: <FaCube w='100%' h='100%' />,
          },
          {
            name: "",
            icon: <IoDocumentsSharp w='100%' h='100%' />,
          },
          {
            name: "",
            icon: <FaPenFancy w='100%' h='100%' />,
          },
        ]}
      />
      <Grid templateColumns={{ sm: "1fr", xl: "repeat(3, 1fr)" }} gap='22px'>
        <PlatformSettings
          title={"إعدادات المنصة"}
          subtitle1={"الحساب"}
          subtitle2={"الإشعارات"}
          userData={userData}
        />
        <ProfileInformation
          title={"معلومات الملف الشخصي"}
          description={
            `مرحباً، أنا ${userData.full_name}. هذا هو ملفي الشخصي في النظام.`
          }
          name={userData.full_name}
          mobile={userData.phone || "لا يوجد رقم هاتف"}
          email={userData.email}
          location={"سوريا"}
          userData={userData}
        />
      </Grid>
    </Flex>
  );
}

export default Profile;