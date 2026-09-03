#!/usr/bin/env python3
"""Generates ios/StardewMaxxing.xcodeproj/project.pbxproj.

The app sources use an Xcode "file system synchronized" group, so new .swift files under
ios/StardewMaxxing/ are picked up automatically with no project edit. The shared core
(../shared) is attached as explicit resource references — a folder reference for the sprites,
so `npm run build:data` updating them is reflected on the next build with nothing to sync.
"""
import hashlib, os, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROJ = ROOT / "ios" / "StardewMaxxing.xcodeproj"

def uid(name):
    """Stable 24-hex ids so regenerating the project produces no spurious diff."""
    return hashlib.sha1(name.encode()).hexdigest()[:24].upper()

# Resources from the shared core. (folder=True -> blue folder reference, keeps its subdirectory
# in the bundle so Bundle.url(forResource:subdirectory:"sprites") resolves.)
RESOURCES = [
    ("items.json",   "../shared/items.json",    "text.json",  False),
    ("machines.json","../shared/machines.json", "text.json",  False),
    ("Zpix.ttf",     "../shared/fonts/Zpix.ttf","file",       False),
    ("sprites",      "../shared/sprites",       "folder",     True),
]

ids = {k: uid(k) for k in [
    "project", "target", "productRef", "mainGroup", "productsGroup", "sharedGroup",
    "syncGroup", "sourcesPhase", "frameworksPhase", "resourcesPhase",
    "projConfigList", "targetConfigList",
    "projDebug", "projRelease", "targetDebug", "targetRelease",
]}
for name, *_ in RESOURCES:
    ids["file_" + name] = uid("file_" + name)
    ids["build_" + name] = uid("build_" + name)

def build_files():
    return "\n".join(
        f'\t\t{ids["build_"+n]} /* {n} in Resources */ = {{isa = PBXBuildFile; fileRef = {ids["file_"+n]} /* {n} */; }};'
        for n, *_ in RESOURCES)

def file_refs():
    out = []
    for n, path, ftype, _ in RESOURCES:
        kind = "lastKnownFileType" if ftype != "file" else "lastKnownFileType"
        out.append(f'\t\t{ids["file_"+n]} /* {n} */ = {{isa = PBXFileReference; {kind} = {ftype}; name = {n}; path = "{path}"; sourceTree = "<group>"; }};')
    return "\n".join(out)

def resource_members():
    return "\n".join(f'\t\t\t\t{ids["build_"+n]} /* {n} in Resources */,' for n, *_ in RESOURCES)

def shared_children():
    return "\n".join(f'\t\t\t\t{ids["file_"+n]} /* {n} */,' for n, *_ in RESOURCES)

COMMON = """
				ALWAYS_SEARCH_USER_PATHS = NO;
				CLANG_ENABLE_MODULES = YES;
				CLANG_ENABLE_OBJC_ARC = YES;
				ENABLE_STRICT_OBJC_MSGSEND = YES;
				GCC_NO_COMMON_BLOCKS = YES;
				IPHONEOS_DEPLOYMENT_TARGET = 17.0;
				SDKROOT = iphoneos;
				SWIFT_STRICT_CONCURRENCY = minimal;
				SWIFT_VERSION = 5.0;"""

TARGET_COMMON = """
				ASSETCATALOG_COMPILER_APPICON_NAME = "";
				CODE_SIGN_STYLE = Automatic;
				CURRENT_PROJECT_VERSION = 1;
				ENABLE_PREVIEWS = YES;
				GENERATE_INFOPLIST_FILE = NO;
				INFOPLIST_FILE = Info.plist;
				LD_RUNPATH_SEARCH_PATHS = (
					"$(inherited)",
					"@executable_path/Frameworks",
				);
				MARKETING_VERSION = 0.1.0;
				PRODUCT_BUNDLE_IDENTIFIER = com.yujin.stardewmaxxing;
				PRODUCT_NAME = "$(TARGET_NAME)";
				SUPPORTS_MACCATALYST = NO;
				SWIFT_EMIT_LOC_STRINGS = YES;
				TARGETED_DEVICE_FAMILY = "1,2";"""

pbx = f"""// !$*UTF8*$!
{{
	archiveVersion = 1;
	classes = {{
	}};
	objectVersion = 77;
	objects = {{

/* Begin PBXBuildFile section */
{build_files()}
/* End PBXBuildFile section */

/* Begin PBXFileReference section */
{file_refs()}
		{ids["productRef"]} /* StardewMaxxing.app */ = {{isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = StardewMaxxing.app; sourceTree = BUILT_PRODUCTS_DIR; }};
/* End PBXFileReference section */

/* Begin PBXFileSystemSynchronizedRootGroup section */
		{ids["syncGroup"]} /* StardewMaxxing */ = {{isa = PBXFileSystemSynchronizedRootGroup; explicitFileTypes = {{}}; explicitFolders = (); path = StardewMaxxing; sourceTree = "<group>"; }};
/* End PBXFileSystemSynchronizedRootGroup section */

/* Begin PBXFrameworksBuildPhase section */
		{ids["frameworksPhase"]} = {{isa = PBXFrameworksBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; }};
/* End PBXFrameworksBuildPhase section */

/* Begin PBXGroup section */
		{ids["mainGroup"]} = {{
			isa = PBXGroup;
			children = (
				{ids["syncGroup"]} /* StardewMaxxing */,
				{ids["sharedGroup"]} /* Shared core */,
				{ids["productsGroup"]} /* Products */,
			);
			sourceTree = "<group>";
		}};
		{ids["sharedGroup"]} /* Shared core */ = {{
			isa = PBXGroup;
			children = (
{shared_children()}
			);
			name = "Shared core";
			sourceTree = "<group>";
		}};
		{ids["productsGroup"]} /* Products */ = {{
			isa = PBXGroup;
			children = (
				{ids["productRef"]} /* StardewMaxxing.app */,
			);
			name = Products;
			sourceTree = "<group>";
		}};
/* End PBXGroup section */

/* Begin PBXNativeTarget section */
		{ids["target"]} /* StardewMaxxing */ = {{
			isa = PBXNativeTarget;
			buildConfigurationList = {ids["targetConfigList"]};
			buildPhases = (
				{ids["sourcesPhase"]},
				{ids["frameworksPhase"]},
				{ids["resourcesPhase"]},
			);
			buildRules = ();
			dependencies = ();
			fileSystemSynchronizedGroups = (
				{ids["syncGroup"]} /* StardewMaxxing */,
			);
			name = StardewMaxxing;
			productName = StardewMaxxing;
			productReference = {ids["productRef"]} /* StardewMaxxing.app */;
			productType = "com.apple.product-type.application";
		}};
/* End PBXNativeTarget section */

/* Begin PBXProject section */
		{ids["project"]} = {{
			isa = PBXProject;
			attributes = {{
				BuildIndependentTargetsInParallel = 1;
				LastSwiftUpdateCheck = 2600;
				LastUpgradeCheck = 2600;
				TargetAttributes = {{
					{ids["target"]} = {{
						CreatedOnToolsVersion = 26.0;
					}};
				}};
			}};
			buildConfigurationList = {ids["projConfigList"]};
			developmentRegion = en;
			hasScannedForEncodings = 0;
			knownRegions = (
				en,
				Base,
				"zh-Hans",
			);
			mainGroup = {ids["mainGroup"]};
			minimizedProjectReferenceProxies = 1;
			preferredProjectObjectVersion = 77;
			productRefGroup = {ids["productsGroup"]} /* Products */;
			projectDirPath = "";
			projectRoot = "";
			targets = (
				{ids["target"]} /* StardewMaxxing */,
			);
		}};
/* End PBXProject section */

/* Begin PBXResourcesBuildPhase section */
		{ids["resourcesPhase"]} = {{
			isa = PBXResourcesBuildPhase;
			buildActionMask = 2147483647;
			files = (
{resource_members()}
			);
			runOnlyForDeploymentPostprocessing = 0;
		}};
/* End PBXResourcesBuildPhase section */

/* Begin PBXSourcesBuildPhase section */
		{ids["sourcesPhase"]} = {{isa = PBXSourcesBuildPhase; buildActionMask = 2147483647; files = (); runOnlyForDeploymentPostprocessing = 0; }};
/* End PBXSourcesBuildPhase section */

/* Begin XCBuildConfiguration section */
		{ids["projDebug"]} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{{COMMON}
				DEBUG_INFORMATION_FORMAT = dwarf;
				ENABLE_TESTABILITY = YES;
				GCC_OPTIMIZATION_LEVEL = 0;
				GCC_PREPROCESSOR_DEFINITIONS = (
					"DEBUG=1",
					"$(inherited)",
				);
				MTL_ENABLE_DEBUG_INFO = INCLUDE_SOURCE;
				ONLY_ACTIVE_ARCH = YES;
				SWIFT_ACTIVE_COMPILATION_CONDITIONS = "DEBUG $(inherited)";
				SWIFT_OPTIMIZATION_LEVEL = "-Onone";
			}};
			name = Debug;
		}};
		{ids["projRelease"]} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{{COMMON}
				DEBUG_INFORMATION_FORMAT = "dwarf-with-dsym";
				ENABLE_NS_ASSERTIONS = NO;
				MTL_ENABLE_DEBUG_INFO = NO;
				SWIFT_COMPILATION_MODE = wholemodule;
				VALIDATE_PRODUCT = YES;
			}};
			name = Release;
		}};
		{ids["targetDebug"]} /* Debug */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{{TARGET_COMMON}
			}};
			name = Debug;
		}};
		{ids["targetRelease"]} /* Release */ = {{
			isa = XCBuildConfiguration;
			buildSettings = {{{TARGET_COMMON}
			}};
			name = Release;
		}};
/* End XCBuildConfiguration section */

/* Begin XCConfigurationList section */
		{ids["projConfigList"]} = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{ids["projDebug"]} /* Debug */,
				{ids["projRelease"]} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
		{ids["targetConfigList"]} = {{
			isa = XCConfigurationList;
			buildConfigurations = (
				{ids["targetDebug"]} /* Debug */,
				{ids["targetRelease"]} /* Release */,
			);
			defaultConfigurationIsVisible = 0;
			defaultConfigurationName = Release;
		}};
/* End XCConfigurationList section */
	}};
	rootObject = {ids["project"]};
}}
"""

PROJ.mkdir(parents=True, exist_ok=True)
(PROJ / "project.pbxproj").write_text(pbx)
print(f"wrote {PROJ / 'project.pbxproj'}")
