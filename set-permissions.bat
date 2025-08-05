@echo off
echo 设置脚本文件执行权限...

REM 在 Windows 上，我们只需要确保文件存在
echo 检查脚本文件...

if exist "deploy-diagnostic.sh" (
    echo ✅ deploy-diagnostic.sh 存在
) else (
    echo ❌ deploy-diagnostic.sh 不存在
)

if exist "deploy-fix.sh" (
    echo ✅ deploy-fix.sh 存在
) else (
    echo ❌ deploy-fix.sh 不存在
)

echo.
echo 注意：在 Linux 服务器上，请运行以下命令设置执行权限：
echo chmod +x deploy-diagnostic.sh deploy-fix.sh
echo.
echo 然后运行诊断脚本：
echo ./deploy-diagnostic.sh
echo.
echo 或运行修复脚本：
echo ./deploy-fix.sh 