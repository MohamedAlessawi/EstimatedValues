import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import Card from "components/Card/Card";
import { useColorModeValue } from "@chakra-ui/react";

const BarChart = (props) => {
  const [chartData, setChartData] = useState(props.chartData || []);
  const [chartOptions, setChartOptions] = useState(props.chartOptions || {});

  // ألوان متكيفة مع السمة
  const textColor = useColorModeValue("gray.800", "white");
  const chartTextColor = useColorModeValue("#2D3748", "#E2E8F0");
  const gridColor = useColorModeValue("#E2E8F0", "#4A5568");
  const cardBg = useColorModeValue("white", "gray.700");
  const tooltipBg = useColorModeValue("#FFFFFF", "#1A202C");
  const tooltipText = useColorModeValue("#2D3748", "#E2E8F0");

  // البيانات الافتراضية
  const defaultData = [
    {
      name: "التنبؤات",
      data: [330, 250, 110, 300, 490, 350, 270, 130, 425],
    },
  ];

  const defaultOptions = {
    chart: {
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
      foreColor: chartTextColor,
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: '60%',
        dataLabels: {
          position: 'top',
        },
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val.toFixed(2);
      },
      offsetY: -20,
      style: {
        fontSize: '11px',
        colors: [chartTextColor],
        fontWeight: 600
      },
      background: {
        enabled: true,
        foreColor: cardBg,
        padding: 4,
        borderRadius: 2,
        borderWidth: 1,
        borderColor: gridColor,
        opacity: 0.9
      }
    },
    xaxis: {
      categories: ["شهر 1", "شهر 2", "شهر 3", "شهر 4", "شهر 5", "شهر 6", "شهر 7", "شهر 8", "شهر 9"],
      title: { 
        text: 'الفترات المستقبلية',
        style: {
          color: chartTextColor,
          fontSize: '12px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '11px'
        },
        rotate: -45
      },
      axisBorder: {
        show: true,
        color: gridColor
      },
      axisTicks: {
        show: true,
        color: gridColor
      }
    },
    yaxis: {
      title: { 
        text: 'القيمة المتوقعة',
        style: {
          color: chartTextColor,
          fontSize: '12px',
          fontWeight: 600
        }
      },
      labels: {
        style: {
          colors: chartTextColor,
          fontSize: '11px'
        },
        formatter: function (value) {
          return value.toFixed(2);
        }
      }
    },
    grid: {
      borderColor: gridColor,
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
  };

  useEffect(() => {
    if (!props.chartData || props.chartData.length === 0) {
      setChartData(defaultData);
      setChartOptions(defaultOptions);
    } else {
      setChartData(props.chartData);
      // دمج الخيارات الممررة مع الخيارات الافتراضية
      setChartOptions({
        ...defaultOptions,
        ...props.chartOptions,
        chart: {
          ...defaultOptions.chart,
          ...props.chartOptions?.chart
        },
        xaxis: {
          ...defaultOptions.xaxis,
          ...props.chartOptions?.xaxis
        },
        yaxis: {
          ...defaultOptions.yaxis,
          ...props.chartOptions?.yaxis
        },
        tooltip: {
          ...defaultOptions.tooltip,
          ...props.chartOptions?.tooltip
        }
      });
    }
  }, [props.chartData, props.chartOptions]);

  return (
    <Card
      py="1rem"
      height={{ sm: "400px" }}
      width="100%"
      bg={cardBg}
      position="relative"
      boxShadow="sm"
      border="1px solid"
      borderColor={useColorModeValue("gray.200", "gray.600")}
    >
      <Chart
        options={chartOptions}
        series={chartData}
        type="bar"
        width="100%"
        height="100%"
      />
    </Card>
  );
};

export default BarChart;