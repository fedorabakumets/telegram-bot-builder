<# @fileoverview Безопасное чтение локального медиа через открытый дескриптор Windows. #>
param([string]$RootPath, [string]$TargetPath, [string]$ExpectedVersion, [string]$Mode)
$ErrorActionPreference = 'Stop'
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
using System.Text;
public static class MediaHandle {
  [StructLayout(LayoutKind.Sequential)] public struct Info {
    public uint Attributes, CreationLow, CreationHigh, AccessLow, AccessHigh, WriteLow, WriteHigh;
    public uint Volume, SizeHigh, SizeLow, Links, IndexHigh, IndexLow;
  }
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern uint GetFinalPathNameByHandleW(SafeFileHandle h, StringBuilder s, uint n, uint flags);
  [DllImport("kernel32.dll", SetLastError=true)] public static extern bool GetFileInformationByHandle(SafeFileHandle h, out Info info);
  public static string FinalPath(SafeFileHandle h) {
    var b = new StringBuilder(32768); var n = GetFinalPathNameByHandleW(h, b, (uint)b.Capacity, 0);
    if (n == 0 || n >= b.Capacity) throw new IOException("Не удалось проверить путь файла");
    string p = b.ToString();
    if (p.StartsWith(@"\\?\UNC\", StringComparison.OrdinalIgnoreCase)) return @"\\" + p.Substring(8);
    if (p.StartsWith(@"\\?\", StringComparison.OrdinalIgnoreCase)) return p.Substring(4);
    return p;
  }
  public static string Version(SafeFileHandle h) {
    Info i; if (!GetFileInformationByHandle(h, out i)) throw new IOException("Не удалось проверить версию файла");
    return String.Format("{0:x8}:{1:x8}{2:x8}:{3:x8}{4:x8}:{5:x8}{6:x8}", i.Volume, i.IndexHigh, i.IndexLow, i.SizeHigh, i.SizeLow, i.WriteHigh, i.WriteLow);
  }
}
"@
try {
  $file = [System.IO.File]::Open($TargetPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite -bor [System.IO.FileShare]::Delete)
  try {
    $final = [MediaHandle]::FinalPath($file.SafeFileHandle)
    $root = [System.IO.Path]::GetFullPath($RootPath).TrimEnd('\') + '\'
    if (!$final.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) { throw 'Путь файла выходит за корень хранилища' }
    $version = [MediaHandle]::Version($file.SafeFileHandle)
    if ($ExpectedVersion -and $ExpectedVersion -ne $version) { throw 'Версия файла изменилась' }
    $header = @{ size = $file.Length; version = $version } | ConvertTo-Json -Compress
    $output = [Console]::OpenStandardOutput()
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($header + "`n")
    $output.Write($bytes, 0, $bytes.Length); $output.Flush()
    if ($Mode -eq 'read') { $file.CopyTo($output); $output.Flush() }
  } finally { $file.Dispose() }
} catch { exit 1 }
