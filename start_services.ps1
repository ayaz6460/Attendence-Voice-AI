$env:PYTHONPATH = "d:\Arena\DIY Voice agent"
Start-Process -FilePath "C:\Program Files\nodejs\node.exe" -ArgumentList "server.js" -WorkingDirectory "d:\Arena\DIY Voice agent"
Start-Process -FilePath "d:\Arena\DIY Voice agent\venv\Scripts\python.exe" -ArgumentList "agent_server.py" -WorkingDirectory "d:\Arena\DIY Voice agent"
Write-Host "Services started! Go to http://localhost:3000"
