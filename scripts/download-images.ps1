# Download all images from Unsplash and organize them locally
# This script will create an images folder and download all images used in the project

$imagesFolder = "C:\Users\NewUser\Desktop\Project-production\frontend\public\images"
$publicFolder = "C:\Users\NewUser\Desktop\Project-production\frontend\public"

# Create images directory structure
$directories = @(
    "$imagesFolder\vehicles",
    "$imagesFolder\backgrounds",
    "$imagesFolder\team"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    }
}

# Define all images with their URLs and local filenames
$images = @(
    # Vehicle Images
    @{
        Url = "https://images.unsplash.com/photo-1536700503339-1e4b06520771?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/tesla-model-s.jpg"
        Description = "Tesla Model S (Saloon)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/mitsubishi-outlander.jpg"
        Description = "Mitsubishi Outlander (SUV)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/mercedes-s-class.jpg"
        Description = "Mercedes-Benz S-Class (Elite)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/rolls-royce-phantom.jpg"
        Description = "Rolls-Royce Phantom (Royale)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/mercedes-v-class.jpg"
        Description = "Mercedes-Benz V-Class (MPV)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1621285853634-713b8dd6b5ee?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/mercedes-vito.jpg"
        Description = "Mercedes-Benz Vito Tourer (Group Elite)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/volkswagen-sharan.jpg"
        Description = "Volkswagen Sharan (MPV)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1601362840469-51e4d8d59085?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/range-rover.jpg"
        Description = "Range Rover (Executive)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1549411223-398244d6935c?q=85&w=1600&auto=format&fit=crop"
        Name = "vehicles/bentley-flying-spur.jpg"
        Description = "Bentley Flying Spur (Grand Tour)"
    },
    
    # Background Images
    @{
        Url = "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=85&w=2400"
        Name = "backgrounds/hero-luxury-car.jpg"
        Description = "Hero Background (Luxury Car at Night)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&q=85&w=2400"
        Name = "backgrounds/airport-terminal.jpg"
        Description = "Airport Terminal Background"
    },
    @{
        Url = "https://images.unsplash.com/photo-1449156001931-828420e8f6b4?auto=format&fit=crop&q=85&w=2400"
        Name = "backgrounds/city-street.jpg"
        Description = "City Street Background"
    },
    @{
        Url = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=85&w=2400"
        Name = "backgrounds/luxury-interior.jpg"
        Description = "Luxury Vehicle Interior"
    },
    @{
        Url = "https://images.unsplash.com/photo-1520986606214-8b456906c813?auto=format&fit=crop&q=80&w=800"
        Name = "backgrounds/uk-map.jpg"
        Description = "UK Map Background"
    },
    @{
        Url = "https://images.unsplash.com/photo-1504711432869-9d9971c219aa?auto=format&fit=crop&q=85&w=2400"
        Name = "backgrounds/press-office.jpg"
        Description = "Press/Office Background"
    },
    
    # Team Images
    @{
        Url = "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200"
        Name = "team/driver-marcus.jpg"
        Description = "Driver Photo (Marcus Sterling)"
    },
    @{
        Url = "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=1200"
        Name = "team/team-meeting.jpg"
        Description = "Team Meeting Photo"
    }
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Downloading Images for Transferline" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$successCount = 0
$failCount = 0

foreach ($image in $images) {
    $destination = Join-Path $imagesFolder $image.Name
    
    Write-Host "Downloading: $($image.Description)..." -ForegroundColor Yellow
    Write-Host "  URL: $($image.Url)" -ForegroundColor Gray
    Write-Host "  Destination: $destination" -ForegroundColor Gray
    
    try {
        Invoke-WebRequest -Uri $image.Url -OutFile $destination -UseBasicParsing
        Write-Host "  Success!" -ForegroundColor Green
        Write-Host ""
        $successCount++
    }
    catch {
        Write-Host "  Failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        $failCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Download Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Successfully downloaded: $successCount images" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "Failed: $failCount images" -ForegroundColor Red
}
Write-Host "`nImages saved to: $imagesFolder" -ForegroundColor Cyan
Write-Host "`nYou can now:" -ForegroundColor Yellow
Write-Host "  1. Replace any image in the folders" -ForegroundColor White
Write-Host "  2. Add new images to these folders" -ForegroundColor White
Write-Host "  3. Reference them in your code as: /images/vehicles/your-image.jpg" -ForegroundColor White
Write-Host "`n========================================`n" -ForegroundColor Cyan
