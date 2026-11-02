import { describe, it, expect } from "vitest";
import * as AdminNotifsPage from "@/app/(admin)/admin/notifications/page";
import * as AuthNotifsPage from "@/app/(authority)/authority/notifications/page";
import { NotificationCenter } from "@/components/notifications/notification-center";

describe("Milestone 7 (R7): Admin Notification Centre (PRD-§16, PRD-§21.3)", () => {
  it("Admin notifications page exports valid metadata and page component", () => {
    expect(AdminNotifsPage.metadata).toBeDefined();
    expect(AdminNotifsPage.metadata.title).toBe("Admin Notifications");
    expect(AdminNotifsPage.default).toBeDefined();
    expect(typeof AdminNotifsPage.default).toBe("function");
  });

  it("Authority notifications page exports valid metadata and page component", () => {
    expect(AuthNotifsPage.metadata).toBeDefined();
    expect(AuthNotifsPage.metadata.title).toBe("Department Notifications");
    expect(AuthNotifsPage.default).toBeDefined();
    expect(typeof AuthNotifsPage.default).toBe("function");
  });

  it("NotificationCenter component is exported and typed", () => {
    expect(NotificationCenter).toBeDefined();
    expect(typeof NotificationCenter).toBe("function");
  });
});

