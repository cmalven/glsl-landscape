
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
#include "lygia/generative/random.glsl"

float rand2D(in vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float rand3D(in vec3 co) {
    return fract(sin(dot(co.xyz ,vec3(12.9898,78.233,144.7272))) * 43758.5453);
}

float dotNoise2D(in float x, in float y, in float fractionalMaxDotSize, in float dDensity) {
    float integer_x = x - fract(x);
    float fractional_x = x - integer_x;

    float integer_y = y - fract(y);
    float fractional_y = y - integer_y;

    if (rand2D(vec2(integer_x+1.0, integer_y +1.0)) > dDensity)
    {return 0.0;}

    float xoffset = (rand2D(vec2(integer_x, integer_y)) -0.5);
    float yoffset = (rand2D(vec2(integer_x+1.0, integer_y)) - 0.5);
    float dotSize = 0.5 * fractionalMaxDotSize * max(0.25,rand2D(vec2(integer_x, integer_y+1.0)));

    vec2 truePos = vec2 (0.5 + xoffset * (1.0 - 2.0 * dotSize) , 0.5 + yoffset * (1.0 -2.0 * dotSize));

    float distance = length(truePos - vec2(fractional_x, fractional_y));

    return 1.0 - smoothstep (0.3 * dotSize, 1.0* dotSize, distance);
}

float DotNoise2D(in vec2 coord, in float wavelength, in float fractionalMaxDotSize, in float dDensity) {
    return dotNoise2D(coord.x/wavelength, coord.y/wavelength, fractionalMaxDotSize, dDensity);
}

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

vec3 mountain(
    in vec2 st,
    in float moveSpeed,
    in float amp1,
    in float period1,
    in float amp2,
    in float period2,
    in float offsetY,
    in vec3 initialColor,
    in vec3 shadeColor,
    in float strength
) {
    vec3 newColor = initialColor;

    float timeOffset = random(offsetY) * 4000.0;
    float speed = u_time * moveSpeed * 0.005;
    float height1 = amp1 * cos(2.0*PI * (((st.x + timeOffset + u_time * 0.1) + speed) / period1));
    float height2 = amp2 * cos(2.0*PI * (((st.x) + timeOffset + u_time * 0.3 + speed) / period2));
    float totalHeight = height1 + height2;
    float yAdjust = 0.3;
    float fgMountainColor = 1.0 - step(totalHeight, st.y - yAdjust - offsetY);
    newColor -= fgMountainColor; // knock out the mountain shape
    newColor = clamp(newColor, vec3(0, 0, 0), vec3(1.0, 1.0, 1.0)); // clamp the total color to black/white
    newColor += (shadeColor + 0.3) * fgMountainColor * strength; // re-add some background color equal to how dramatic we want the mountain to be
    newColor += shadeColor * 4.0 * fgMountainColor * st.y * (1.0 - strength);
    newColor += shadeColor * 4.0 * fgMountainColor * st.y * totalHeight*3.0;

    // Mountain shadow
    float shadowAngle = distance(0.5, st.x) * 3.0;
    float mountainFgShadowY1 = amp1 * cos(2.0*PI * ((st.x + shadowAngle * st.y + speed) / period1) );
    float mountainFgShadowY2 = amp2 * cos(2.0*PI * ((st.x + shadowAngle * st.y + speed) / period2));
    float mountainFgShadowHeight = mountainFgShadowY1 + mountainFgShadowY2;
    float elevationChangeDir = totalHeight - mountainFgShadowHeight;
    newColor += elevationChangeDir * vec3(1.00, 1.00, 1.00) * 1.0 * (1.0 - st.y) * fgMountainColor;

    return newColor;
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

    // Mountains (Background)
    color = mountain(
        st,
        0.04, // speed
        0.02, // amp1
        0.5, // period1
        0.02, // amp2
        0.4, // period2
        0.05, // offsetY
        color, // initialColor
        skyColor, // color,
        1.0 // strength
    );

    // Mountains (Background)
    color = mountain(
        st,
        0.09, // speed
        0.04, // amp1
        1.0, // period1
        0.02, // amp2
        0.4, // period2
        0.03, // offsetY
        color, // initialColor
        skyColor, // color,
        0.5 // strength
    );

    // Mountains (Foreground)
    color = mountain(
        st,
        0.19, // speed
        0.06, // amp1
        1.0, // period1
        0.02, // amp2
        0.4, // period2
        -0.05, // offsetY
        color, // initialColor
        skyColor, // color,
        0.1 // strength
    );

    // Dust
    float noiseSpeedX = 2.0 * u_time;
    vec2 noisePos = vec2(st.x, st.y) + vec2(noiseSpeedX, 0.0);
    float oscAmp = 0.1;
    float oscPeriod = 3.0;
    float noiseStrength = 0.3;
    noiseStrength = oscAmp * sin((PI * 2.0) * (u_time / oscPeriod)) + noiseStrength;
    noiseStrength *= st.y + 0.3;
    float noiseWavelength = 0.1;
    float noiseSize = 0.08;
    float noiseDensity = 1.0;
    float noise1 = DotNoise2D(noisePos, noiseWavelength, noiseSize, noiseDensity);
    float noise2 = DotNoise2D(noisePos - u_time*vec2(0.5, 0.0), noiseWavelength, noiseSize, noiseDensity);
    color += noise1 * noiseStrength;
    color += noise2 * noiseStrength;

    gl_FragColor = vec4(color, 1.0);
}
