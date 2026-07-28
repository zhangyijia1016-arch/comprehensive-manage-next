import { atom } from "recoil";
import { storage } from "@/utils/storage";

export type UserInfo = {
  userName?: string;
  userNumber?: string;
  userClass?: string;
  identity?: string;
};

export const tokenState = atom<string>({
  key: "tokenState",
  default: "",
  effects_UNSTABLE: [
    ({ setSelf, onSet }) => {
      const token = storage.get("token");
      if (token) setSelf(token);
      onSet((newValue) => {
        if (newValue) storage.set("token", newValue);
        else storage.remove("token");
      });
    },
  ],
});

export const refreshTokenState = atom<string>({
  key: "refreshTokenState",
  default: "",
  effects_UNSTABLE: [
    ({ setSelf, onSet }) => {
      const token = storage.get("refreshToken");
      if (token) setSelf(token);
      onSet((newValue) => {
        if (newValue) storage.set("refreshToken", newValue);
        else storage.remove("refreshToken");
      });
    },
  ],
});

export const userInfoState = atom<UserInfo>({
  key: "userInfoState",
  default: {},
  effects_UNSTABLE: [
    ({ setSelf, onSet }) => {
      const raw = storage.get("userInfo");
      if (raw) {
        try {
          setSelf(JSON.parse(raw));
        } catch {
          setSelf({});
        }
      }
      onSet((newValue) => {
        storage.set("userInfo", JSON.stringify(newValue || {}));
      });
    },
  ],
});
