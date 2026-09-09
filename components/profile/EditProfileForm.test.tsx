/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import EditProfileForm from "./EditProfileForm";
import { LocaleProvider } from "@/lib/i18n";
import { Role, type UserResponse } from "@/types/user/user";

const user: UserResponse = {
  id: 1, username: "debater", firstName: "Deb", lastName: "Ater", email: "debater@example.com",
  role: Role.PARTICIPANT, profileId: 42, socialProfiles: [], createdAt: "2026-06-18T00:00:00",
};

function openEditor() {
  fireEvent.click(screen.getByRole("button", { name: "Edit profile" }));
}

function change(label: string, value: string) {
  fireEvent.change(screen.getByRole("textbox", { name: label }), { target: { value } });
}

function submit() {
  fireEvent.submit(screen.getByRole("form", { name: "Edit profile" }));
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("EditProfileForm", () => {
  afterEach(() => window.localStorage.clear());

  it("opens a labeled form populated with the current profile and focuses the nickname", () => {
    render(<EditProfileForm user={user} onSave={jest.fn()} />);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    openEditor();
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("debater");
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue("Deb");
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue("Ater");
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveValue("debater@example.com");
  });

  it("trims text and sends only changed account fields", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", " NewName123 ");
    change("First name", " Деб ");
    change("Last name", " Ater ");
    change("Email", " new@example.com ");
    submit();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."));
    expect(onSave).toHaveBeenCalledWith({ username: "NewName123", firstName: "Деб", email: "new@example.com" }, expect.any(AbortSignal));
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("NewName123");
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("No changes to save.");
  });

  it("does not submit an unchanged or whitespace-only edit", () => {
    const onSave = jest.fn();
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    submit();
    change("First name", " Deb ");
    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("No changes to save.");
  });

  it("accepts an email on a single-label domain supported by the backend", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Email", "person@intranet");
    submit();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."));
    expect(onSave).toHaveBeenCalledWith({ email: "person@intranet" }, expect.any(AbortSignal));
  });

  it.each([
    ["Nickname", "ab", "3–20"],
    ["Nickname", "a".repeat(21), "3–20"],
    ["Nickname", "Имя123", "3–20"],
    ["Nickname", "name_name", "3–20"],
    ["First name", "   ", "first and last name"],
    ["First name", "a".repeat(51), "first and last name"],
    ["Last name", "   ", "first and last name"],
    ["Last name", "a".repeat(51), "first and last name"],
    ["Email", "not-an-email", "valid email"],
    ["Email", "two@@example.com", "valid email"],
    ["Email", "space @example.com", "valid email"],
    ["Email", `${"a".repeat(45)}@ex.co`, "valid email"],
  ])("rejects invalid %s (%s) without a request", (field, value, message) => {
    const onSave = jest.fn();
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change(field, value);
    submit();
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("textbox", { name: field })).toHaveValue(value);
  });

  it.each(["abc", "a".repeat(20)])("accepts nickname boundary %s and names/email at 50 characters", async (username) => {
    const onSave = jest.fn().mockResolvedValue(undefined);
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", username);
    change("First name", "а".repeat(50));
    change("Last name", "ә".repeat(50));
    change("Email", `${"a".repeat(44)}@ex.co`);
    submit();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it("prevents duplicate submissions while pending and preserves data for retry on failure", async () => {
    const pending = deferred();
    const onSave = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(undefined);
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", "newname");
    submit();
    submit();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: "Nickname" })).toBeDisabled();
    await act(async () => pending.reject(new Error("That nickname is taken.")));
    expect(screen.getByRole("alert")).toHaveTextContent("That nickname is taken.");
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("newname");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    submit();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Profile updated."));
  });

  it("discards drafts and restores focus on cancel, then opens with current server values", () => {
    const onSave = jest.fn();
    const { rerender } = render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", "draftname");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit profile" })).toHaveFocus();
    rerender(<EditProfileForm user={{ ...user, username: "freshname" }} onSave={onSave} />);
    openEditor();
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("freshname");
    expect(onSave).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)("ignores late %s after cancel and reopen without clearing a newer request", async (outcome) => {
    const old = deferred();
    const fresh = deferred();
    const onSave = jest.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(fresh.promise);
    render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", "oldname");
    submit();
    const oldSignal: AbortSignal = onSave.mock.calls[0][1];
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(oldSignal.aborted).toBe(true);
    openEditor();
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("debater");
    change("Nickname", "newname");
    submit();
    await act(async () => outcome === "resolve" ? old.resolve() : old.reject(new Error("Stale error")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
    await act(async () => fresh.resolve());
    expect(screen.getByRole("status")).toHaveTextContent("Profile updated.");
  });

  it("resets and invalidates pending callbacks when the profile ID changes", async () => {
    const pending = deferred();
    const onSave = jest.fn().mockReturnValue(pending.promise);
    const { rerender } = render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", "draftname");
    submit();
    const oldSignal: AbortSignal = onSave.mock.calls[0][1];
    rerender(<EditProfileForm user={{ ...user, id: 2, username: "second" }} onSave={onSave} />);
    expect(oldSignal.aborted).toBe(true);
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    openEditor();
    await act(async () => pending.resolve());
    expect(screen.getByRole("textbox", { name: "Nickname" })).toHaveValue("second");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("invalidates an unfinished request on unmount", async () => {
    const pending = deferred();
    const onSave = jest.fn().mockReturnValue(pending.promise);
    const { unmount } = render(<EditProfileForm user={user} onSave={onSave} />);
    openEditor();
    change("Nickname", "newname");
    submit();
    const signal: AbortSignal = onSave.mock.calls[0][1];
    unmount();
    expect(signal.aborted).toBe(true);
    await act(async () => pending.resolve());
  });

  it.each([
    ["ru", "Редактировать профиль", "Никнейм", "Сохранить изменения", "Отмена"],
    ["kk", "Профильді өңдеу", "Лақап ат", "Өзгерістерді сақтау", "Бас тарту"],
  ])("localizes the editor into %s", async (locale, edit, nickname, save, cancel) => {
    window.localStorage.setItem("debetter-locale", locale);
    render(<LocaleProvider><EditProfileForm user={user} onSave={jest.fn()} /></LocaleProvider>);
    await waitFor(() => expect(screen.getByRole("button", { name: edit })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: edit }));
    expect(screen.getByRole("textbox", { name: nickname })).toHaveValue("debater");
    expect(screen.getByRole("button", { name: save })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: cancel })).toBeInTheDocument();
  });
});
