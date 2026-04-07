"use client";

import { useAppStore } from "@/store/useAppStore";
import { KeyValuePair } from "@/types";
import React, { useRef, useState } from "react";

interface VariableInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: "input" | "textarea";
  style?: React.CSSProperties;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  extraVariables?: KeyValuePair[];
}

export default function VariableInput({
  value,
  onChange,
  placeholder,
  type = "input",
  style,
  onKeyDown,
  extraVariables = [],
}: VariableInputProps) {
  const { environments, activeEnvironmentId } = useAppStore();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [cursorPos, setCursorPos] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleScroll = (
    e: React.UIEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    if (overlayRef.current) {
      overlayRef.current.scrollTop = e.currentTarget.scrollTop;
      overlayRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const allVars = React.useMemo(() => {
    const global = environments.find((e) => e.id === "global")?.variables || [];
    const active =
      environments.find((e) => e.id === activeEnvironmentId)?.variables || [];
    const globalSec =
      environments.find((e) => e.id === "global")?.secrets || [];
    const activeSec =
      environments.find((e) => e.id === activeEnvironmentId)?.secrets || [];

    const map = new Map<
      string,
      { key: string; value: string; isSecret: boolean; isGlobal: boolean }
    >();
    global.forEach((v) =>
      map.set(v.key, {
        key: v.key,
        value: v.currentValue,
        isSecret: false,
        isGlobal: true,
      }),
    );
    globalSec.forEach((v) =>
      map.set(v.key, {
        key: v.key,
        value: v.currentValue,
        isSecret: true,
        isGlobal: true,
      }),
    );
    active.forEach((v) =>
      map.set(v.key, {
        key: v.key,
        value: v.currentValue,
        isSecret: false,
        isGlobal: false,
      }),
    );
    activeSec.forEach((v) =>
      map.set(v.key, {
        key: v.key,
        value: v.currentValue,
        isSecret: true,
        isGlobal: false,
      }),
    );
    extraVariables.forEach((v) =>
      map.set(v.key, {
        key: v.key,
        value: v.value,
        isSecret: false,
        isGlobal: false,
      }),
    );

    return Array.from(map.values()).filter((v) => v.key);
  }, [environments, activeEnvironmentId, extraVariables]);

  const filteredVars = allVars.filter((v) =>
    v.key.toLowerCase().includes(suggestionFilter.toLowerCase()),
  );

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const val = e.target.value;
    const pos = e.target.selectionStart || 0;
    setCursorPos(pos);
    onChange(val);

    const textBefore = val.slice(0, pos);
    const lastTrigger = textBefore.lastIndexOf("<<");
    if (lastTrigger !== -1 && lastTrigger >= textBefore.lastIndexOf(">>")) {
      setShowSuggestions(true);
      setSuggestionFilter(textBefore.slice(lastTrigger + 2));
      setSelectedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (key: string) => {
    const textBefore = value.slice(0, cursorPos);
    const lastTrigger = textBefore.lastIndexOf("<<");
    const textAfter = value.slice(cursorPos);
    const newValue = value.slice(0, lastTrigger) + `<<${key}>>` + textAfter;
    onChange(newValue);
    setShowSuggestions(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = lastTrigger + key.length + 4;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredVars.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(
          (i) => (i - 1 + filteredVars.length) % filteredVars.length,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        if (filteredVars[selectedIndex]) {
          selectSuggestion(filteredVars[selectedIndex].key);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const sharedPadding =
    style?.padding ?? (type === "textarea" ? "10px 12px" : "6px 8px");
  const sharedFontSize = style?.fontSize ?? "12px";
  const sharedFontFamily = style?.fontFamily ?? "inherit";
  const sharedLineHeight = style?.lineHeight ?? "1.5";

  const typographyStyle: React.CSSProperties = {
    padding: sharedPadding,
    fontSize: sharedFontSize,
    fontFamily: sharedFontFamily,
    lineHeight: sharedLineHeight,
    boxSizing: "border-box" as const,
  };

  const renderHighlighted = () => {
    if (!value) return null;

    const parts = value.split(/(<<.+?>>)/g);
    return parts.map((part, i) => {
      if (part.startsWith("<<") && part.endsWith(">>")) {
        const key = part.slice(2, -2);
        const variable = allVars.find((v) => v.key === key);
        const exists = !!variable;
        const tooltip = variable
          ? variable.isSecret
            ? "Secret Variable (Masked)"
            : variable.value || "(Empty)"
          : "Variable not found";

        return (
          <span
            key={i}
            title={tooltip}
            style={{
              color: exists ? "var(--accent-green)" : "var(--accent-red)",
              background: exists
                ? "rgba(63,185,80,0.15)"
                : "rgba(255,123,114,0.15)",
              borderRadius: 3,
              padding: "0 2px",
              fontWeight: 600,
              pointerEvents: "none",
            }}
          >
            {part}
          </span>
        );
      }
      // Plain text - make it visible with normal color
      return (
        <span key={i} style={{ color: "var(--text-primary)" }}>
          {part}
        </span>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      spellCheck={false}
      style={{
        position: "relative",
        display: "flex",
        width: style?.width ?? "100%",
        height: style?.height ?? "100%",
        minWidth: style?.minWidth,
        maxWidth: style?.maxWidth,
        minHeight: style?.minHeight,
        flex: style?.flex,
        flexShrink: style?.flexShrink,
        background: style?.background ?? "transparent",
        border: style?.border,
        borderLeft: style?.borderLeft,
        borderRight: style?.borderRight,
        borderTop: style?.borderTop,
        borderBottom: style?.borderBottom,
        borderRadius: style?.borderRadius,
        outline: style?.outline,
      }}
    >
      {/* Overlay: renders colored text for both variables and plain text */}
      <div
        ref={overlayRef}
        className="variable-input-overlay"
        style={{
          ...typographyStyle,
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "auto",
          zIndex: 2,
          // Hide scrollbar but keep functionality for sync
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>
          {`
            .variable-input-overlay::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
        {/* Inner span mirrors exactly the input's padding + text flow */}
        <span
          style={{
            display: "block",
            width: "100%",
            whiteSpace: type === "textarea" ? "pre-wrap" : "pre",
            wordBreak: type === "textarea" ? "break-word" : "normal",
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          {renderHighlighted()}
          {/* Add invisible placeholder text when empty */}
          {!value && placeholder && (
            <span style={{ color: "var(--text-placeholder)", opacity: 0.5 }}>
              {placeholder}
            </span>
          )}
        </span>
      </div>

      {/* Actual input: now visible text with transparent background */}
      {type === "input" ? (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleGlobalKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          style={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            height: "100%",
            ...typographyStyle,
            color: "transparent", // Make input text transparent so overlay shows through
            background: "transparent",
            border: "none",
            outline: "none",
            caretColor: "var(--text-primary)", // Keep caret visible
          }}
        />
      ) : (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleInput}
          onScroll={handleScroll}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === "Tab" && !showSuggestions) {
              e.preventDefault();
              const start = e.currentTarget.selectionStart;
              const end = e.currentTarget.selectionEnd;
              const newValue =
                value.substring(0, start) + "  " + value.substring(end);
              onChange(newValue);
              setTimeout(() => {
                if (inputRef.current) {
                  inputRef.current.selectionStart =
                    inputRef.current.selectionEnd = start + 2;
                }
              }, 0);
            } else {
              handleGlobalKeyDown(e);
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          style={{
            position: "relative",
            zIndex: 3,
            width: "100%",
            height: "100%",
            ...typographyStyle,
            color: "transparent", // Make input text transparent so overlay shows through
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            caretColor: "var(--text-primary)", // Keep caret visible
          }}
        />
      )}

      {/* Suggestions Popover */}
      {showSuggestions && filteredVars.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            marginBottom: 4,
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
            zIndex: 1000,
            width: 250,
            maxHeight: 200,
            overflowY: "auto",
            padding: 4,
          }}
        >
          <div
            style={{
              padding: "4px 8px",
              fontSize: 10,
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            Environment Variables
          </div>
          {filteredVars.map((v, i) => (
            <div
              key={v.key}
              onClick={() => selectSuggestion(v.key)}
              onMouseEnter={() => setSelectedIndex(i)}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                borderRadius: 4,
                background: i === selectedIndex ? "var(--bg-active)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                color:
                  i === selectedIndex
                    ? "var(--accent-blue)"
                    : "var(--text-primary)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: v.isGlobal
                    ? "var(--accent-yellow)"
                    : "var(--accent-green)",
                }}
              />
              <span style={{ fontWeight: 500 }}>{v.key}</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: "var(--text-muted)",
                }}
              >
                {v.isSecret ? "Secret" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
