precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_viewportSize;
uniform vec2 u_cardPos;
uniform vec2 u_cardSize;
uniform vec2 u_cardCenter;
uniform float u_distortionVw;
uniform float u_edgePower;
uniform float u_cornerRadiusVw;
uniform float u_chromaStrength;
uniform float u_time;
uniform float u_dragging;

varying vec2 v_uv;

bool insideRoundedRect(vec2 px, vec2 size, float R) {
  if (px.x >= R && px.x <= size.x - R) return true;
  if (px.y >= R && px.y <= size.y - R) return true;
  vec2 c;
  if (px.x <= R && px.y <= R) c = vec2(R, R);
  else if (px.x >= size.x - R && px.y <= R) c = vec2(size.x - R, R);
  else if (px.x <= R && px.y >= size.y - R) c = vec2(R, size.y - R);
  else if (px.x >= size.x - R && px.y >= size.y - R) c = vec2(size.x - R, size.y - R);
  else return true;
  return length(px - c) <= R;
}

void main() {
  float R = (u_cornerRadiusVw / 100.0) * u_viewportSize.x;
  vec2 px = v_uv * u_cardSize;
  if (!insideRoundedRect(px, u_cardSize, R)) discard;

  vec2 viewportPos = u_cardPos + v_uv * u_cardSize;
  vec2 texCoord = viewportPos / u_viewportSize;

  float distToEdge = min(min(v_uv.x, v_uv.y), min(1.0 - v_uv.x, 1.0 - v_uv.y));
  float edgeZone = 1.0 - smoothstep(0.0, 0.2, distToEdge);
  vec2 fromCenter = (v_uv - 0.5) * u_cardSize;
  vec2 fromCenterNorm = fromCenter / u_cardSize;
  float vwNorm = u_distortionVw / 100.0;
  vec2 offset = fromCenterNorm * edgeZone * vwNorm;

  float wobbleZone = 1.0 - smoothstep(0.0, 0.06, distToEdge);
  float wobble = u_dragging * 0.012 * sin(u_time * 2.0) * wobbleZone;
  offset += fromCenterNorm * wobble;

  texCoord += offset;
  texCoord = clamp(texCoord, 0.001, 0.999);

  float chroma = u_chromaStrength * edgeZone * 0.003;
  vec2 uvR = clamp(texCoord + vec2(chroma, 0.0), 0.001, 0.999);
  vec2 uvB = clamp(texCoord - vec2(chroma, 0.0), 0.001, 0.999);
  float r = texture2D(u_texture, uvR).r;
  float g = texture2D(u_texture, texCoord).g;
  float b = texture2D(u_texture, uvB).b;
  vec4 color = vec4(r, g, b, 1.0);
  gl_FragColor = color;
}
