"use client";

import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Card, Form, Input, Typography, message } from "antd";
import { loginApi } from "@/services/api/auth";
import { refreshTokenState, tokenState, userInfoState } from "@/store/atom/auth";
import { storage } from "@/utils/storage";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSetRecoilState } from "recoil";

export default function LoginPage() {
  const { Title, Paragraph } = Typography;
  const router = useRouter();
  const setToken = useSetRecoilState(tokenState);
  const setRefreshToken = useSetRecoilState(refreshTokenState);
  const setUserInfo = useSetRecoilState(userInfoState);
  const [userNumber, setUserNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    storage.remove("token");
    storage.remove("refreshToken");
    storage.remove("identity");
    storage.remove("userInfo");
    setToken("");
    setRefreshToken("");
    setUserInfo({});
  }, [setRefreshToken, setToken, setUserInfo]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await loginApi(userNumber, password);
      if (res.code !== 200 || !res.data) {
        message.error(res.msg || "登录失败");
        return;
      }

      const payload = res.data;
      const nextToken =
        typeof payload.token === "object"
          ? payload.token.accessToken || ""
          : payload.accessToken || (typeof payload.token === "string" ? payload.token : "");
      const nextRefresh =
        typeof payload.token === "object"
          ? payload.token.refreshToken || payload.refreshToken || ""
          : payload.refreshToken || "";

      setToken(nextToken);
      setRefreshToken(nextRefresh);
      setUserInfo({
        userName: payload.user?.userName,
        userNumber: payload.user?.userNumber,
        userClass: payload.user?.userClass,
        identity: payload.identity,
      });

      router.push("/home");
    } catch {
      message.error("登录失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#091a7a_0%,#1677ff_52%,#13c2c2_100%)] p-6">
      <Card className="w-full max-w-[460px] rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.18)]">
        <Title level={2} className="mb-2">
          综测系统登录
        </Title>
        <Paragraph type="secondary" className="mb-8">
          Comprehensive Testing Management System
        </Paragraph>

        <Form layout="vertical" onSubmitCapture={handleSubmit}>
          <Form.Item label="账号" required>
            <Input
              size="large"
              prefix={<UserOutlined />}
              placeholder="请输入账号"
              value={userNumber}
              onChange={(e) => setUserNumber(e.target.value)}
            />
          </Form.Item>
          <Form.Item label="密码" required>
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} size="large" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  );
}
