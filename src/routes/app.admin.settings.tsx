import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { fetchAdminCompanySettings, updateCompanySettings } from "@/lib/attendanceService";
import { MapPin, Sliders, Globe, Locate, Check, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/app/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { currentUser } = useStore();

  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role !== "admin") return <Navigate to="/app/dashboard" />;

  const [companyName, setCompanyName] = useState("Gemshine Infotech");
  const [latitude, setLatitude] = useState<number>(28.6139);
  const [longitude, setLongitude] = useState<number>(77.209);
  const [allowedRadius, setAllowedRadius] = useState<number>(100);
  const [enforceGeofencing, setEnforceGeofencing] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCompanySettings();
      if (res.data?.settings) {
        const s = res.data.settings;
        setCompanyName(s.companyName || "Gemshine Infotech");
        setLatitude(Number(s.latitude) || 28.6139);
        setLongitude(Number(s.longitude) || 77.209);
        setAllowedRadius(Number(s.allowedRadius) || 100);
        setEnforceGeofencing(s.enforceGeofencing !== false);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load company settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Company Name is required.");
      return;
    }
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      toast.error("Latitude must be between -90 and 90.");
      return;
    }
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      toast.error("Longitude must be between -180 and 180.");
      return;
    }
    if (isNaN(allowedRadius) || allowedRadius <= 0) {
      toast.error("Allowed Radius must be a positive number.");
      return;
    }

    setSaving(true);
    try {
      await updateCompanySettings({
        companyName,
        latitude,
        longitude,
        allowedRadius,
        enforceGeofencing,
      });
      toast.success("Company settings updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const autofillCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingGps(true);
    toast.info("Requesting current GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(parseFloat(position.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(position.coords.longitude.toFixed(6)));
        setFetchingGps(false);
        toast.success("Successfully captured current GPS location!");
      },
      (error) => {
        setFetchingGps(false);
        let msg = "Failed to fetch GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Permission denied. Please allow location access in your browser settings.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Location request timed out.";
        }
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Admin Settings"
        description="Configure geofencing properties, office coordinates, and attendance rules."
      />

      {loading ? (
        <Card className="border-0 shadow-sm ring-1 ring-black/5">
          <CardContent className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading geofencing configuration...
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="shadow-md border-0 ring-1 ring-black/5 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-border/40 pb-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">Company Location & Radius</CardTitle>
                  <CardDescription>
                    Specify the central office coordinates and allowed radial boundaries.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="font-semibold text-sm">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className="focus-visible:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="latitude" className="font-semibold text-sm">
                    Latitude
                  </Label>
                  <div className="relative">
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      placeholder="e.g. 28.6139"
                      className="pl-9 focus-visible:ring-blue-500"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="longitude" className="font-semibold text-sm">
                    Longitude
                  </Label>
                  <div className="relative">
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      placeholder="e.g. 77.2090"
                      className="pl-9 focus-visible:ring-blue-500"
                    />
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autofillCurrentLocation}
                  disabled={fetchingGps}
                  className="bg-white border-blue-200 hover:bg-blue-50 text-blue-700 font-medium flex items-center gap-1.5"
                >
                  <Locate className="h-4 w-4" />
                  {fetchingGps ? "Acquiring Position..." : "Set to My Current Location"}
                </Button>
              </div>

              <hr className="border-border/60" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="space-y-1.5">
                  <Label htmlFor="allowedRadius" className="font-semibold text-sm">
                    Allowed Radius (meters)
                  </Label>
                  <div className="relative">
                    <Input
                      id="allowedRadius"
                      type="number"
                      value={allowedRadius}
                      onChange={(e) => setAllowedRadius(parseInt(e.target.value) || 0)}
                      placeholder="e.g. 100"
                      className="pl-9 focus-visible:ring-blue-500"
                    />
                    <Sliders className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Employees must be within this circle to check-in.
                  </span>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50/50 border border-blue-100/50">
                  <ShieldAlert className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-blue-900">
                      Map Visualization Helper
                    </span>
                    <p className="text-[11px] leading-relaxed text-blue-700">
                      Standard settings are 100 meters. Radius boundaries are calculated
                      mathematically via the Haversine model on standard global ellipsoids.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-0 ring-1 ring-black/5 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <Label
                    htmlFor="enforceGeofencing"
                    className="font-bold text-base text-foreground"
                  >
                    Enforce Geofencing Bounds
                  </Label>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When enabled, employees will be strictly blocked from checking in if they are
                    outside the configured allowed radius. If disabled, they can check in anywhere,
                    but distance violations will be flagged on attendance reports.
                  </p>
                </div>
                <Switch
                  id="enforceGeofencing"
                  checked={enforceGeofencing}
                  onCheckedChange={setEnforceGeofencing}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md w-36 font-semibold flex items-center justify-center gap-1.5"
            >
              <Check className="h-4 w-4" />
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
