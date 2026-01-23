import React, { useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";
import { useColorModeValue } from "@chakra-ui/react";

const LineChart = (props) => {
  const [chartData, setChartData] = useState(props.chartData || []);
  const [chartOptions, setChartOptions] = useState(props.chartOptions || {});

  // ألوان متكيفة مع السمة
  const textColor = useColorModeValue("gray.800", "white");
  const chartTextColor = useColorModeValue("#2D3748", "#E2E8F0");
  const gridColor = useColorModeValue("#E2E8F0", "#4A5568");
  const cardBg = useColorModeValue("white", "gray.700");

  // البيانات الافتراضية
  const defaultData = [
    {
      name: "البيانات",
      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
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
      categories: ["فترة 1", "فترة 2", "فترة 3", "فترة 4", "فترة 5", "فترة 6", "فترة 7", "فترة 8", "فترة 9"],
      title: { 
        text: 'الفترات الزمنية',
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
        }
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
        text: 'القيمة',
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
            return 'القيمة:';
          }
        }
      },
      x: {
        formatter: function (value, { dataPointIndex }) {
          return `الفترة ${dataPointIndex + 1}`;
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
            }
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
    <ReactApexChart
      options={chartOptions}
      series={chartData}
      type="line"
      width="100%"
      height="100%"
    />
  );
};

export default LineChart;