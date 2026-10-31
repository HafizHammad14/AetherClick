param(
    [string]$Action = "minimize"
)

$ErrorActionPreference = "SilentlyContinue"

try {
    Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinHelper {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", CharSet = CharSet.Auto)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public static void MinimizeApp() {
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(hWnd, sb, 256);
                string title = sb.ToString();
                if (title.Contains("AetherClick") && !title.Contains("Antigravity")) {
                    ShowWindow(hWnd, 6);
                    return false;
                }
            }
            return true;
        }, IntPtr.Zero);
    }

    public static void CloseApp() {
        EnumWindows((hWnd, lParam) => {
            if (IsWindowVisible(hWnd)) {
                StringBuilder sb = new StringBuilder(256);
                GetWindowText(hWnd, sb, 256);
                string title = sb.ToString();
                if (title.Contains("AetherClick") && !title.Contains("Antigravity")) {
                    PostMessage(hWnd, 0x0010, IntPtr.Zero, IntPtr.Zero);
                    return false;
                }
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@
} catch {}

if ($Action -eq "close") {
    [WinHelper]::CloseApp()
} else {
    [WinHelper]::MinimizeApp()
}
