import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";

const ApiTester = () => {
  const [url, setUrl] = useState(
    "https://jsonplaceholder.typicode.com/posts?userId=1&_limit=5"
  );
  const [method, setMethod] = useState("GET");
  const [activeTab, setActiveTab] = useState("Params");
  const [queryParams, setQueryParams] = useState([
    // Will be populated from URL on component mount
  ]);

  // New state for Phase 2
  const [headers, setHeaders] = useState([
    {
      key: "User-Agent",
      value: "API-Tester/1.0",
      description: "User agent string",
      enabled: true,
    },
  ]);
  const [requestBody, setRequestBody] = useState("");
  const [authorization, setAuthorization] = useState({
    type: "none", // none, bearer, basic, apikey
    token: "",
    username: "",
    password: "",
    apiKey: "",
    apiValue: "",
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sidebar resize state
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);
  const animationFrameRef = useRef(null);

  const httpMethods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
  ];
  const tabs = [
    "Params",
    "Authorization",
    "Headers",
    "Body",
    "Scripts",
    "Tests",
    "Settings",
  ];

  const collections = [
    {
      name: "Authify",
      items: [],
    },
    {
      name: "BookMyEvent",
      items: [],
    },
    {
      name: "Mapping Service API",
      items: [],
    },
    {
      name: "New Collection",
      items: [],
    },
  ];

  const addQueryParam = () => {
    const updated = [
      ...queryParams,
      { key: "", value: "", description: "", enabled: true },
    ];
    setQueryParams(updated);
    // No need to update URL yet since key is empty
  };

  const updateQueryParam = (index, field, value) => {
    const updated = queryParams.map((param, i) =>
      i === index ? { ...param, [field]: value } : param
    );
    setQueryParams(updated);
    updateUrlWithParams(updated);
  };

  const toggleQueryParam = (index) => {
    const updated = queryParams.map((param, i) =>
      i === index ? { ...param, enabled: !param.enabled } : param
    );
    setQueryParams(updated);
    updateUrlWithParams(updated);
  };

  const addHeader = () => {
    setHeaders([
      ...headers,
      { key: "", value: "", description: "", enabled: true },
    ]);
  };

  const updateHeader = (index, field, value) => {
    const updated = headers.map((header, i) =>
      i === index ? { ...header, [field]: value } : header
    );
    setHeaders(updated);
  };

  const toggleHeader = (index) => {
    const updated = headers.map((header, i) =>
      i === index ? { ...header, enabled: !header.enabled } : header
    );
    setHeaders(updated);
  };

  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const removeQueryParam = (index) => {
    const updated = queryParams.filter((_, i) => i !== index);
    setQueryParams(updated);
    updateUrlWithParams(updated);
  };

  // URL and params synchronization
  const updateUrlWithParams = (params) => {
    try {
      // Get base URL without query parameters
      let baseUrl = url.split("?")[0];

      // Filter enabled params with both key and value
      const enabledParams = params.filter(
        (param) => param.enabled && param.key && param.key.trim()
      );

      if (enabledParams.length === 0) {
        setUrl(baseUrl);
        return;
      }

      // Build query string following REST conventions
      const urlParams = new URLSearchParams();
      enabledParams.forEach((param) => {
        // Only add params that have both key and value
        if (param.value || param.value === "") {
          urlParams.append(param.key.trim(), param.value);
        }
      });

      const queryString = urlParams.toString();
      setUrl(`${baseUrl}${queryString ? "?" + queryString : ""}`);
    } catch (error) {
      // If URL parsing fails, don't update
      console.warn("Failed to update URL with params:", error);
    }
  };

  const parseUrlParams = (urlString) => {
    try {
      if (!urlString || !urlString.includes("?")) {
        return [];
      }

      const urlObj = new URL(
        urlString.startsWith("http") ? urlString : `https://${urlString}`
      );
      const params = [];

      urlObj.searchParams.forEach((value, key) => {
        params.push({
          key,
          value,
          description: "",
          enabled: true,
        });
      });

      return params;
    } catch (error) {
      // If URL is invalid, try to parse query string manually
      try {
        const queryString = urlString.split("?")[1];
        if (!queryString) return [];

        const params = [];
        const pairs = queryString.split("&");

        pairs.forEach((pair) => {
          const [key, value = ""] = pair.split("=");
          if (key) {
            params.push({
              key: decodeURIComponent(key),
              value: decodeURIComponent(value),
              description: "",
              enabled: true,
            });
          }
        });

        return params;
      } catch {
        return [];
      }
    }
  };

  const handleUrlChange = (newUrl) => {
    setUrl(newUrl);

    // Parse query params from URL and update params state
    const parsedParams = parseUrlParams(newUrl);

    // Keep existing disabled params that aren't in the new URL
    const existingDisabled = queryParams.filter(
      (param) =>
        !param.enabled && !parsedParams.some((p) => p.key === param.key)
    );

    setQueryParams([...parsedParams, ...existingDisabled]);
  };

  // Resizable sidebar handlers
  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;

      // Direct DOM manipulation for immediate response with bounds checking
      if (sidebarRef.current && newWidth >= 200 && newWidth <= 600) {
        // Use direct style manipulation for immediate visual feedback
        sidebarRef.current.style.width = `${newWidth}px`;
      }

      // Update state less frequently for React consistency
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (newWidth >= 200 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      });
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const handleDoubleClick = () => {
    setSidebarWidth(280); // Reset to default width
    if (sidebarRef.current) {
      sidebarRef.current.style.width = "280px";
    }
  };

  // API Request handler
  const handleSendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Validate URL
      if (!url.trim()) {
        throw new Error("URL is required");
      }

      let validUrl;
      try {
        validUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
      } catch {
        throw new Error("Invalid URL format");
      }

      // Build URL with query params - use current URL since it's already synced
      let requestUrl = validUrl.toString();

      // Build headers
      const requestHeaders = {};
      headers
        .filter((header) => header.enabled && header.key)
        .forEach((header) => {
          requestHeaders[header.key] = header.value;
        });

      // Add authorization header if needed
      if (authorization.type === "bearer" && authorization.token) {
        requestHeaders["Authorization"] = `Bearer ${authorization.token}`;
      } else if (
        authorization.type === "basic" &&
        authorization.username &&
        authorization.password
      ) {
        const credentials = btoa(
          `${authorization.username}:${authorization.password}`
        );
        requestHeaders["Authorization"] = `Basic ${credentials}`;
      } else if (
        authorization.type === "apikey" &&
        authorization.apiKey &&
        authorization.apiValue
      ) {
        requestHeaders[authorization.apiKey] = authorization.apiValue;
      }

      // Prepare request config
      const config = {
        method: method.toLowerCase(),
        url: requestUrl,
        headers: requestHeaders,
        timeout: 30000, // 30 second timeout
      };

      // Add body for methods that support it
      if (
        ["post", "put", "patch"].includes(method.toLowerCase()) &&
        requestBody.trim()
      ) {
        try {
          // Try to parse as JSON first
          config.data = JSON.parse(requestBody);
          // Ensure Content-Type is set for JSON
          if (
            !requestHeaders["Content-Type"] &&
            !requestHeaders["content-type"]
          ) {
            config.headers["Content-Type"] = "application/json";
          }
        } catch (e) {
          // If not valid JSON, send as string
          config.data = requestBody;
        }
      }

      const startTime = Date.now();
      const response = await axios(config);
      const endTime = Date.now();

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        time: endTime - startTime,
        size: JSON.stringify(response.data).length,
      });
    } catch (err) {
      const endTime = Date.now();
      let errorData = {
        message: err.message,
        time: endTime - Date.now(),
      };

      if (err.response) {
        // Server responded with error status
        errorData = {
          ...errorData,
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
        };
      } else if (err.request) {
        // Request was made but no response received
        errorData.message =
          "No response received - check your network connection";
      }

      setError(errorData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove, {
        passive: false,
      });
      document.addEventListener("mouseup", handleMouseUp, { passive: false });
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
      // Disable pointer events on other elements during resize for better performance
      document.body.style.pointerEvents = "none";
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = "auto";
      }
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = "";
      }
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.pointerEvents = "";
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to send request
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!loading) {
          handleSendRequest();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading]);

  // Initialize params from default URL on mount
  useEffect(() => {
    if (url && queryParams.length === 0) {
      const parsedParams = parseUrlParams(url);
      setQueryParams(parsedParams);
    }
  }, []); // Only run on mount

  return (
    <div className="flex h-screen bg-dark-bg text-white font-system text-sm">
      {/* Left Sidebar - Collections */}
      <div
        ref={sidebarRef}
        className="bg-dark-sidebar border-r border-dark-border flex flex-col relative"
        style={{
          width: `${sidebarWidth}px`,
          minWidth: "200px",
          maxWidth: "600px",
          willChange: isResizing ? "width" : "auto",
        }}
      >
        <div className="flex items-center px-4 py-3 border-b border-dark-border gap-2">
          <div className="text-base">📁</div>
          <span className="flex-1 font-medium">Collections</span>
          <button className="hover:bg-dark-hover text-text-secondary p-1 rounded">
            +
          </button>
          <button className="hover:bg-dark-hover text-text-secondary p-1 rounded">
            🔍
          </button>
        </div>
        <div className="px-4 py-2 border-b border-dark-border">
          <input
            type="text"
            placeholder="Search collections"
            className="w-full bg-dark-input border border-dark-border rounded px-2 py-1.5 text-text-secondary text-xs placeholder-text-muted"
          />
        </div>

        <div className="flex-1 py-2">
          {collections.map((collection, index) => (
            <div
              key={index}
              className="flex items-center px-4 py-1.5 hover:bg-dark-hover cursor-pointer gap-2"
            >
              <span className="text-xs text-text-muted">▶</span>
              <span>{collection.name}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dark-border py-2">
          <div className="flex items-center px-4 py-2 hover:bg-dark-hover cursor-pointer gap-2">
            <span>🌍</span>
            <span>Environments</span>
          </div>
          <div className="flex items-center px-4 py-2 hover:bg-dark-hover cursor-pointer gap-2">
            <span>🔗</span>
            <span>Flows</span>
          </div>
          <div className="flex items-center px-4 py-2 hover:bg-dark-hover cursor-pointer gap-2">
            <span>📜</span>
            <span>History</span>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-accent-blue/20 z-10 group"
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          style={{
            background: isResizing ? "rgba(0, 122, 204, 0.3)" : "transparent",
            transition: isResizing ? "none" : "background-color 0.15s ease",
          }}
          title="Drag to resize or double-click to reset"
        >
          {/* Visual indicator line */}
          <div
            className="absolute top-0 right-0 w-px h-full transition-all duration-150"
            style={{
              background: isResizing ? "#007acc" : "transparent",
            }}
          />

          {/* Hover indicator dots */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity duration-150">
            <div className="flex flex-col gap-1">
              <div className="w-0.5 h-0.5 bg-text-secondary rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-text-secondary rounded-full"></div>
              <div className="w-0.5 h-0.5 bg-text-secondary rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Request Builder */}
        <div className="flex-1 flex flex-col">
          {/* URL Bar */}
          <div className="flex items-center px-4 py-3 bg-dark-panel border-b border-dark-border gap-2">
            <select
              className="bg-accent-orange text-white border-0 rounded px-3 py-2 text-xs font-semibold cursor-pointer min-w-20"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              {httpMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <input
              type="text"
              className="flex-1 bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Enter request URL"
            />

            <button
              className="bg-accent-blue text-white border-0 rounded px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSendRequest}
              disabled={loading}
              title={`Send request (${
                navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"
              }+Enter)`}
            >
              {loading ? "Sending..." : "Send"}
            </button>
            <button className="bg-transparent border border-dark-border text-text-secondary rounded px-3 py-2 text-xs cursor-pointer hover:bg-dark-hover">
              Save
            </button>
            <button className="bg-transparent border-0 text-text-secondary cursor-pointer px-2 py-2 rounded hover:bg-dark-hover">
              ⋯
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-dark-sidebar border-b border-dark-border px-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`bg-transparent border-0 text-text-secondary px-4 py-3 cursor-pointer border-b-2 border-transparent text-xs flex items-center gap-1 hover:text-white ${
                  activeTab === tab ? "text-white border-b-accent-blue" : ""
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
                {tab === "Params" &&
                  queryParams.filter((p) => p.enabled && p.key).length > 0 && (
                    <span className="text-text-muted text-xs">
                      ({queryParams.filter((p) => p.enabled && p.key).length})
                    </span>
                  )}
                {tab === "Headers" &&
                  headers.filter((h) => h.enabled && h.key).length > 0 && (
                    <span className="text-text-muted text-xs">
                      ({headers.filter((h) => h.enabled && h.key).length})
                    </span>
                  )}
                {tab === "Body" && requestBody.trim() && (
                  <span className="text-cyan-400 text-xs">●</span>
                )}
              </button>
            ))}
            <div className="ml-auto text-text-secondary text-xs cursor-pointer hover:text-white">
              <span>Cookies</span>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 bg-dark-bg overflow-y-auto">
            {activeTab === "Params" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="m-0 text-sm font-medium">Query Params</h3>
                    <span className="text-xs text-green-400 opacity-75">
                      • Synced with URL
                    </span>
                  </div>
                  <button className="bg-transparent border-0 text-text-muted cursor-pointer text-xs hover:text-text-secondary">
                    ⋯ Bulk Edit
                  </button>
                </div>

                <div className="border border-dark-border rounded overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-dark-sidebar border-b border-dark-border py-2 text-xs font-medium text-text-muted">
                    <div className="flex items-center justify-center"></div>
                    <div className="px-2">Key</div>
                    <div className="px-2">Value</div>
                    <div className="px-2">Description</div>
                    <div className="flex items-center justify-center"></div>
                  </div>

                  {queryParams.map((param, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_40px] border-b border-dark-border bg-dark-bg last:border-b-0"
                    >
                      <div className="flex items-center justify-center p-2">
                        <input
                          type="checkbox"
                          checked={param.enabled}
                          onChange={() => toggleQueryParam(index)}
                          className="accent-accent-blue"
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={param.key}
                          onChange={(e) =>
                            updateQueryParam(index, "key", e.target.value)
                          }
                          placeholder="Key"
                          className={`w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none ${
                            param.enabled && param.key && !param.value
                              ? "border-l-2 border-l-yellow-500"
                              : ""
                          }`}
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={param.value}
                          onChange={(e) =>
                            updateQueryParam(index, "value", e.target.value)
                          }
                          placeholder="Value"
                          className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={param.description}
                          onChange={(e) =>
                            updateQueryParam(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Description"
                          className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-center p-1">
                        <button
                          className="bg-transparent border-0 text-text-muted cursor-pointer p-1 rounded hover:text-text-secondary hover:bg-dark-hover"
                          onClick={() => removeQueryParam(index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  <div
                    className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-dark-bg opacity-70 cursor-pointer hover:opacity-100"
                    onClick={addQueryParam}
                  >
                    <div className="flex items-center justify-center p-2">
                      <input
                        type="checkbox"
                        className="accent-accent-blue"
                        disabled
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Key"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Value"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-center p-1"></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Headers" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="m-0 text-sm font-medium">Headers</h3>
                  <button className="bg-transparent border-0 text-text-muted cursor-pointer text-xs hover:text-text-secondary">
                    ⋯ Bulk Edit
                  </button>
                </div>

                <div className="border border-dark-border rounded overflow-hidden">
                  <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-dark-sidebar border-b border-dark-border py-2 text-xs font-medium text-text-muted">
                    <div className="flex items-center justify-center"></div>
                    <div className="px-2">Key</div>
                    <div className="px-2">Value</div>
                    <div className="px-2">Description</div>
                    <div className="flex items-center justify-center"></div>
                  </div>

                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[40px_1fr_1fr_1fr_40px] border-b border-dark-border bg-dark-bg last:border-b-0"
                    >
                      <div className="flex items-center justify-center p-2">
                        <input
                          type="checkbox"
                          checked={header.enabled}
                          onChange={() => toggleHeader(index)}
                          className="accent-accent-blue"
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={header.key}
                          onChange={(e) =>
                            updateHeader(index, "key", e.target.value)
                          }
                          placeholder="Key"
                          className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={header.value}
                          onChange={(e) =>
                            updateHeader(index, "value", e.target.value)
                          }
                          placeholder="Value"
                          className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        />
                      </div>
                      <div className="p-1 border-r border-dark-border">
                        <input
                          type="text"
                          value={header.description}
                          onChange={(e) =>
                            updateHeader(index, "description", e.target.value)
                          }
                          placeholder="Description"
                          className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-center p-1">
                        <button
                          className="bg-transparent border-0 text-text-muted cursor-pointer p-1 rounded hover:text-text-secondary hover:bg-dark-hover"
                          onClick={() => removeHeader(index)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}

                  <div
                    className="grid grid-cols-[40px_1fr_1fr_1fr_40px] bg-dark-bg opacity-70 cursor-pointer hover:opacity-100"
                    onClick={addHeader}
                  >
                    <div className="flex items-center justify-center p-2">
                      <input
                        type="checkbox"
                        className="accent-accent-blue"
                        disabled
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Key"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Value"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="p-1 border-r border-dark-border">
                      <input
                        type="text"
                        placeholder="Description"
                        className="w-full bg-transparent border-0 text-white p-1.5 text-xs placeholder-text-muted focus:outline-none"
                        readOnly
                      />
                    </div>
                    <div className="flex items-center justify-center p-1"></div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Body" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="m-0 text-sm font-medium">Request Body</h3>
                  <div className="flex gap-2">
                    <select className="bg-dark-input border border-dark-border rounded px-2 py-1 text-xs text-white">
                      <option>JSON</option>
                      <option>XML</option>
                      <option>Text</option>
                      <option>HTML</option>
                    </select>
                    <button className="bg-transparent border-0 text-text-muted cursor-pointer text-xs hover:text-text-secondary">
                      Beautify
                    </button>
                  </div>
                </div>

                <div className="border border-dark-border rounded overflow-hidden">
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder="Enter request body..."
                    className="w-full h-64 bg-dark-bg border-0 text-white p-3 text-sm font-mono placeholder-text-muted focus:outline-none resize-none"
                    style={{
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    }}
                  />
                </div>
              </div>
            )}

            {activeTab === "Authorization" && (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="m-0 text-sm font-medium mb-3">
                    Authorization
                  </h3>
                  <select
                    value={authorization.type}
                    onChange={(e) =>
                      setAuthorization({
                        ...authorization,
                        type: e.target.value,
                      })
                    }
                    className="bg-dark-input border border-dark-border rounded px-3 py-2 text-sm text-white min-w-32"
                  >
                    <option value="none">No Auth</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="basic">Basic Auth</option>
                    <option value="apikey">API Key</option>
                  </select>
                </div>

                {authorization.type === "bearer" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Token
                      </label>
                      <input
                        type="text"
                        value={authorization.token}
                        onChange={(e) =>
                          setAuthorization({
                            ...authorization,
                            token: e.target.value,
                          })
                        }
                        placeholder="Enter bearer token"
                        className="w-full bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {authorization.type === "basic" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={authorization.username}
                        onChange={(e) =>
                          setAuthorization({
                            ...authorization,
                            username: e.target.value,
                          })
                        }
                        placeholder="Enter username"
                        className="w-full bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={authorization.password}
                        onChange={(e) =>
                          setAuthorization({
                            ...authorization,
                            password: e.target.value,
                          })
                        }
                        placeholder="Enter password"
                        className="w-full bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {authorization.type === "apikey" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Key
                      </label>
                      <input
                        type="text"
                        value={authorization.apiKey}
                        onChange={(e) =>
                          setAuthorization({
                            ...authorization,
                            apiKey: e.target.value,
                          })
                        }
                        placeholder="Enter API key name"
                        className="w-full bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Value
                      </label>
                      <input
                        type="text"
                        value={authorization.apiValue}
                        onChange={(e) =>
                          setAuthorization({
                            ...authorization,
                            apiValue: e.target.value,
                          })
                        }
                        placeholder="Enter API key value"
                        className="w-full bg-dark-input border border-dark-border rounded px-3 py-2 text-white text-sm placeholder-text-muted focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {["Scripts", "Tests", "Settings"].includes(activeTab) && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-text-muted">
                  <div className="text-4xl mb-3">🚧</div>
                  <p className="m-0 text-sm">
                    {activeTab} functionality coming soon
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Response Section */}
        <div className="h-80 bg-dark-sidebar border-t border-dark-border flex flex-col">
          <div className="px-4 border-b border-dark-border">
            <div className="flex gap-4 items-center">
              <button className="bg-transparent border-0 text-text-secondary py-3 cursor-pointer border-b-2 border-transparent text-xs text-white border-b-accent-blue">
                Response
              </button>
              <button className="bg-transparent border-0 text-text-secondary py-3 cursor-pointer border-b-2 border-transparent text-xs hover:text-white">
                🕐 History
              </button>
              {(response || error) && (
                <button
                  className="ml-auto bg-transparent border-0 text-text-muted py-1 px-2 cursor-pointer text-xs hover:text-text-secondary rounded hover:bg-dark-hover"
                  onClick={() => {
                    setResponse(null);
                    setError(null);
                  }}
                  title="Clear response"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-dark-bg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-text-muted">
                  <div className="animate-spin text-2xl mb-2">⚡</div>
                  <p className="m-0 text-sm">Sending request...</p>
                </div>
              </div>
            ) : error ? (
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-red-400 font-semibold">
                      {error.status || "Error"}
                    </span>
                    <span className="text-text-secondary text-sm">
                      {error.statusText || error.message}
                    </span>
                    {error.time && (
                      <span className="ml-auto text-text-muted text-xs">
                        {error.time}ms
                      </span>
                    )}
                  </div>
                  {error.data && (
                    <div className="bg-dark-input border border-red-500/30 rounded p-3">
                      <pre className="text-red-400 text-xs font-mono overflow-x-auto">
                        {typeof error.data === "object"
                          ? JSON.stringify(error.data, null, 2)
                          : String(error.data)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : response ? (
              <div className="h-full overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center gap-4 mb-4">
                    <span
                      className={`font-semibold ${
                        response.status >= 200 && response.status < 300
                          ? "text-green-400"
                          : response.status >= 400
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {response.status} {response.statusText}
                    </span>
                    <span className="text-text-muted text-sm">
                      Time: {response.time}ms
                    </span>
                    <span className="text-text-muted text-sm">
                      Size: {response.size} bytes
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-text-secondary">
                        Response Body
                      </h4>
                      <div className="bg-dark-input border border-dark-border rounded p-3 max-h-64 overflow-y-auto">
                        <pre className="text-white text-xs font-mono">
                          {typeof response.data === "object"
                            ? JSON.stringify(response.data, null, 2)
                            : String(response.data)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-2 text-text-secondary">
                        Response Headers
                      </h4>
                      <div className="bg-dark-input border border-dark-border rounded p-3 max-h-32 overflow-y-auto">
                        <pre className="text-text-muted text-xs font-mono">
                          {Object.entries(response.headers || {})
                            .map(([key, value]) => `${key}: ${value}`)
                            .join("\n")}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-text-muted">
                  <div className="text-5xl mb-4">🚀</div>
                  <p className="m-0 text-sm">Click Send to get a response</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTester;
