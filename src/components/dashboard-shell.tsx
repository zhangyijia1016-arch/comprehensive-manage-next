"use client";

import {
  AppstoreOutlined,
  BarChartOutlined,
  FileTextOutlined,
  LogoutOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Avatar, Breadcrumb, Dropdown, Layout, Menu, Space, Typography } from "antd";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { tokenState, userInfoState } from "@/store/atom/auth";
import { menuGroups } from "@/constant/menu";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { Header, Sider, Content } = Layout;
  const { Text } = Typography;
  const pathname = usePathname();
  const router = useRouter();
  const [userInfo, setUserInfo] = useRecoilState(userInfoState);
  const token = useRecoilValue(tokenState);
  const [openKeys, setOpenKeys] = useState<string[]>(["assessmentManagement"]);
  const [mounted, setMounted] = useState(false);
  const headerHeight = 60;
  const allMenuItems = menuGroups.flatMap((group) => group.items as readonly { href: string; label: string }[]);

  const activeLabel = useMemo(() => {
    return allMenuItems.find((item) => item.href === pathname)?.label ?? "首页";
  }, [allMenuItems, pathname]);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("identity");
    localStorage.removeItem("userInfo");
    setUserInfo({});
    router.push("/login");
  };

  const iconMap: Record<string, React.ReactNode> = {
    home: <BarChartOutlined />,
    assessmentManagement: <AppstoreOutlined />,
    scoreManagement: <FileTextOutlined />,
    comprehensiveAgent: <RobotOutlined />,
  };

  const items = [
    {
      key: "/home",
      icon: iconMap.home,
      label: "首页",
      onClick: () => router.push("/home"),
    },
    ...menuGroups
      .filter((group) => group.key !== "home")
      .map((group) => ({
        key: group.key,
        icon: iconMap[group.key],
        label: group.label,
        children: group.items.map((item) => ({
          key: item.href,
          label: item.label,
        })),
      })),
  ];

  return (
    <Layout className="h-screen overflow-hidden">
      <Header className="flex w-full items-center justify-between bg-gradient-to-r from-[#4794ff] to-[#5fa7ff] px-7" style={{ height: headerHeight, lineHeight: `${headerHeight}px` }}>
        <Space size="middle" className="text-white">
          <TeamOutlined className="text-lg text-white" />
          <Text className="text-base text-white">信息工程学院学生综合测评管理系统</Text>
        </Space>
        <Dropdown
          menu={{
            items: [{ key: "logout", label: "退出登录", icon: <LogoutOutlined />, onClick: handleLogout }],
          }}
          trigger={["click"]}
        >
          <Space className="cursor-pointer">
            <Avatar>{mounted && userInfo.userName ? userInfo.userName.slice(0, 1) : "U"}</Avatar>
            <Text className="text-white">{mounted && userInfo.userName ? `欢迎您，${userInfo.userName}` : activeLabel}</Text>
          </Space>
        </Dropdown>
      </Header>

      <Layout className="flex-1 overflow-hidden">
        <Sider
          width={280}
          theme="light"
          className="overflow-auto border-r border-[#f0f0f0] bg-white"
          style={{ height: `calc(100vh - ${headerHeight}px)` }}
        >
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys as string[])}
            onClick={({ key }) => router.push(String(key))}
            items={items}
            className="h-full pt-3"
            style={{ borderInlineEnd: 0 }}
          />
        </Sider>

        <Layout className="overflow-hidden">
          <Content
            className="overflow-auto p-6"
            style={{ height: `calc(100vh - ${headerHeight}px)` }}
          >
            <div className="min-h-full rounded-2xl bg-white">
              {children}
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}
