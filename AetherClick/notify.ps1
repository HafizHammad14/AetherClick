param(
    [string]$Title = "AetherClick",
    [string]$Message = "AutoClicker Active",
    [string]$LogoPath = ""
)

if (-not $LogoPath -or -not (Test-Path $LogoPath)) {
    $LogoPath = Join-Path $PSScriptRoot "logo.png"
}

$ErrorActionPreference = "SilentlyContinue"

try {
    Add-Type -AssemblyName System.Security
    $safeTitle = [System.Security.SecurityElement]::Escape($Title)
    $safeMsg = [System.Security.SecurityElement]::Escape($Message)

    $imageTag = ""
    if ($LogoPath -and (Test-Path $LogoPath)) {
        $imageTag = "<image placement=`"appLogoOverride`" src=`"$LogoPath`" hint-crop=`"circle`"/>"
    }

    [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

    $xml = @"
<toast>
    <visual>
        <binding template="ToastGeneric">
            <text>$safeTitle</text>
            <text>$safeMsg</text>
            $imageTag
        </binding>
    </visual>
</toast>
"@
    $doc = [Windows.Data.Xml.Dom.XmlDocument]::new()
    $doc.LoadXml($xml)
    $toast = [Windows.UI.Notifications.ToastNotification]::new($doc)
    [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("AetherClick").Show($toast)
} catch {
    # Reliable Tray Balloon fallback
    try {
        Add-Type -AssemblyName System.Windows.Forms
        $ni = New-Object System.Windows.Forms.NotifyIcon
        $ni.Icon = [System.Drawing.SystemIcons]::Information
        $ni.Visible = $true
        $ni.ShowBalloonTip(2500, $Title, $Message, [System.Windows.Forms.ToolTipIcon]::Info)
        Start-Sleep -Milliseconds 600
        $ni.Dispose()
    } catch {}
}
