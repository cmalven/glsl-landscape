
#ifdef GL_ES
precision highp float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#include "lygia/space/ratio.glsl"
#include "lygia/draw/fill.glsl"
#include "lygia/draw/stroke.glsl"
#include "lygia/draw/flip.glsl"
#include "lygia/draw/digits.glsl"
#include "lygia/sdf/circleSDF.glsl"
#include "lygia/sdf/triSDF.glsl"
#include "lygia/sdf/raysSDF.glsl"
#include "lygia/space/scale.glsl"
#include "lygia/space/rotate.glsl"
#include "lygia/generative/snoise.glsl"
#include "lygia/color/blend/multiply.glsl"

vec3 cloud(in vec2 st, in vec2 offset, in float dist) {
    float cloudSpeed = (1.0 - dist) * 0.1;
    vec2 basePos = st + offset * vec2(-1.0, 1.0);
    float moveOffset = mod(u_time * cloudSpeed, 1.5);
    vec2 currentPos = basePos + vec2(moveOffset - 1.0, 0);
    float cloudSdf = triSDF(currentPos);
    float cloudColor = (1.0 - dist) * 0.1;
    float cloudSize = (1.0 - dist) * 0.1;
    return fill(cloudSdf, cloudSize) * vec3(cloudColor, cloudColor, cloudColor);
}

void main(void) {
    vec3 color = vec3(0.0);
    vec2 st = gl_FragCoord.xy/u_resolution.xy;

    // Sky
    vec3 skyColor = vec3(st.y * sin(u_time * 0.6) * 0.8, st.y * 0.6, st.y * 0.8);
    color += skyColor;

    // Sun
    vec2 sunPos = vec2(0.5, 0.6);
    float sunSdf = circleSDF(st, sunPos);
    float sunStroke = 0.1;
    float sunScale = 0.3;
    color += fill(sunSdf, sunScale) * vec3(0.8, 0.6, 0.4);

    // Sunlight
    float sunDist = 1.0 - distance(sunPos - vec2(0, 0.02), st);
    color += 0.6 * sunDist;

    // Sun rays
    float rays = raysSDF(rotate(st - vec2(0, 0.1), 0.05 * u_time), 50);
    float rayStrength = 0.02;
    float rayThick = 0.15;
    color += fill(rays, rayThick * st.y) * vec3(rayStrength * st.y);

    // Clouds
    color += cloud(st, vec2(-0.1, -0.4), 0.1);
    color += cloud(st, vec2(-0.2, -0.4), 0.1);
    color += cloud(st, vec2(-0.2, -0.2), 0.4);
    color += cloud(st, vec2(-0.13, -0.2), 0.4);
    color += cloud(st, vec2(0.1, 0.05), 0.6);
    color += cloud(st, vec2(0.145, 0.05), 0.6);
    color += cloud(st, vec2(0.19, 0.05), 0.6);

    // City (Background)
    float cityBgPanTime = u_time * 0.04;
    float cityBgY1 = 0.04 * cos(2.0*PI * ((st.x + cityBgPanTime) / 0.5) );
    float cityBgY2 = 0.04 * cos(2.0*PI * ((st.x + cityBgPanTime) / 0.2));
    color -= (1.0 - step(cityBgY1 + cityBgY2*0.1, st.y - 0.32)) * 0.04;

    // Mountains (Background)
    float mountainBgPanTime = u_time * 0.09;
    float mountainBgY1 = 0.04 * cos(2.0*PI * ((st.x + mountainBgPanTime) / 1.0) );
    float mountainBgY2 = 0.04 * cos(2.0*PI * ((st.x + mountainBgPanTime) / 0.4));
    float bgMountainColor = (1.0 - step(mountainBgY1 + mountainBgY2*0.1, st.y - 0.3));
    color -= bgMountainColor;
    color = clamp(color, vec3(0, 0, 0), vec3(1.0, 1.0, 1.0));
    color += (skyColor + 0.1) * bgMountainColor;

    // Mountains (Background)
    float mountainFgPanTime = u_time * 0.19;
    float mountainFgY1 = 0.06 * cos(2.0*PI * ((st.x + mountainFgPanTime) / 1.0) );
    float mountainFgY2 = 0.02 * cos(2.0*PI * ((st.x + mountainFgPanTime) / 0.4));
    float mountainFgHeight = mountainFgY1 + mountainFgY2;
    float fgMountainColor = 1.0 - step(mountainFgHeight, st.y - 0.3);
    color -= fgMountainColor;
    color = clamp(color, vec3(0, 0, 0), vec3(1.0, 1.0, 1.0));
    color += skyColor * 4.0 * fgMountainColor * st.y;
    color += skyColor * 4.0 * fgMountainColor * st.y * mountainFgHeight*3.0;

    gl_FragColor = vec4(color, 1.0);
}
