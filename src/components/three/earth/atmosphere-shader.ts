/** Fresnel-based atmosphere glow — the classic "rim light" trick for a
 * planet: a slightly larger sphere, rendered back-face-only with additive
 * blending, whose opacity increases toward the silhouette edge (where the
 * view ray grazes the surface) and drops to near-zero head-on. Cheap
 * (two-pass, no post-processing pass needed) and reads as atmospheric
 * scattering without a real physically-based scattering simulation. */
export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uColor;
  uniform float uIntensity;

  void main() {
    // vNormal is in view space here, so its z faces the camera directly —
    // comparing against (0,0,1) is the same as a view-direction dot
    // product without needing to pass the view vector separately.
    float fresnel = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
    gl_FragColor = vec4(uColor, clamp(fresnel, 0.0, 1.0) * uIntensity);
  }
`;
