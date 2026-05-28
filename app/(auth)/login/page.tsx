"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Wrench, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณาใส่รหัสผ่าน"),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = (data: FormData) => {
    setError("");
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        router.push("/");
        router.refresh();
      }
    });
  };

  return (
    <div
      style={{ background: "var(--bg)", minHeight: "100vh" }}
      className="flex items-center justify-center p-4"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="inline-flex h-14 w-14 items-center justify-center rounded-xl mb-4"
            style={{ background: "var(--brand-soft)", border: "0.5px solid var(--brand)" }}
          >
            <Wrench className="h-7 w-7" style={{ color: "var(--brand)" }} />
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--text)" }}>
            MainteX
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-sub)" }}>
            ระบบบริหารจัดการการบำรุงรักษา
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "var(--panel)",
            border: "0.5px solid var(--line)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-4">
              <label
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "var(--text-sub)" }}
              >
                อีเมล
              </label>
              <input
                {...register("email")}
                type="email"
                autoComplete="email"
                placeholder="you@skmc.co.th"
                className="w-full rounded-lg px-3 py-2 text-sm transition-all"
                style={{
                  background: "var(--panel-2)",
                  border: `0.5px solid ${errors.email ? "var(--danger)" : "var(--line)"}`,
                  color: "var(--text)",
                  outline: "none",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--brand)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = errors.email
                    ? "var(--danger)"
                    : "var(--line)")
                }
              />
              {errors.email && (
                <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-5">
              <label
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "var(--text-sub)" }}
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-lg px-3 py-2 pr-10 text-sm transition-all"
                  style={{
                    background: "var(--panel-2)",
                    border: `0.5px solid ${errors.password ? "var(--danger)" : "var(--line)"}`,
                    color: "var(--text)",
                    outline: "none",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--brand)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = errors.password
                      ? "var(--danger)"
                      : "var(--line)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPw ? (
                    <EyeOff className="h-4 w-4" style={{ color: "var(--text-sub)" }} />
                  ) : (
                    <Eye className="h-4 w-4" style={{ color: "var(--text-sub)" }} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="mb-4 rounded-lg px-3 py-2 text-sm"
                style={{ background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-white transition-all"
              style={{
                background: isPending ? "var(--text-sub)" : "var(--brand)",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              เข้าสู่ระบบ
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs" style={{ color: "var(--text-disabled)" }}>
          MainteX v0.1 · Powered by MainteX
        </p>
      </div>
    </div>
  );
}
