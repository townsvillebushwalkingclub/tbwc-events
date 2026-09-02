$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$AuthorName = 'townsvillebushwalkingclub'
$AuthorEmail = 'townsvillebushwalkingclub@gmail.com'
$CoAuthorTrailer = 'Co-authored-by: luen <Luen@users.noreply.github.com>'

git config --local user.name $AuthorName
git config --local user.email $AuthorEmail
git config --local core.hooksPath .githooks

Write-Host 'Configured local git author for this repository:'
Write-Host "  user.name  = $(git config --local user.name)"
Write-Host "  user.email = $(git config --local user.email)"
Write-Host "  hooksPath  = $(git config --local core.hooksPath)"
Write-Host "Commits will include: $CoAuthorTrailer"
