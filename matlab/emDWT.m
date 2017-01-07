% C,M is a colo or graysacle
% a,u is a brightness and size scaling of M
% u resizes M, if u=1 the size is unchanged
% DWT(C)={cA,cH,cV,cD}
% embedding by replacing  cD-coefficients
% with a*Mu
% m is a binary resized embedded watermark
% [S, m] = emDWT(150, 0.8, 'db37', M, C)

function [S, m] = emDWT(a, u, w, M, C)

C = double(C); % container
M = M(:, :, 1); % message

M = im2bw(M); % make message binary
M = imresize(M, u); % scale message
M = double(M);
M = a * M; % change brightnress in [0, 1]

[x, y] = size(M); % message size

for z = 1:size(C,3)  % iterate over container's color channels
    c = C(:,:,z); % got current channel slice
    [cA, cH, cV, cD] = dwt2(c, w, 'mode', 'per');
    [x1, y1] = size(cD); % cD-coefficient size
    minWidth = min(x, x1);
    minHeight = min(y, y1);

    Z = cD; % copy of cD for changing

    Z(1:minWidth, 1:minHeight) = M(1:minWidth, 1:minHeight); % embedding without overflow
    s{z} = idwt2(cA, cH, cV, Z, w, 'mode', 'per'); % reverse slice creation
end

if size(C,3) == 3 % for truecolor image we have 3 channels
    S = cat(3, s{1}, s{2}, s{3}); % concat them
else
    S = s{1}; % grayscale image
end

%S=uint8(S);
m(1:minWidth, 1:minHeight) = uint8(M(1:minWidth, 1:minHeight) / a);