# РџСЂРѕРІРµСЂРєР° MCP СЃРµСЂРІРµСЂРѕРІ
Write-Host "рџ”Ќ РџСЂРѕРІРµСЂРєР° MCP СЃРµСЂРІРµСЂРѕРІ..." -ForegroundColor Yellow

 = @(
    "@modelcontextprotocol/server-filesystem",
    "@modelcontextprotocol/server-browser", 
    "@modelcontextprotocol/server-memory",
    "@modelcontextprotocol/server-git"
)

foreach ($server in $servers) {
    try {
        npx $server --version
        Write-Host "вњ… $server СЂР°Р±РѕС‚Р°РµС‚" -ForegroundColor Green
    } catch {
        Write-Host "вќЊ $server РЅРµ СЂР°Р±РѕС‚Р°РµС‚" -ForegroundColor Red
    }
}

