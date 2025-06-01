// const breakpoints = {
//     xs: '320px',
//     sm: '576px',
//     md: '768px',
//     lg: '992px',
//     xl: '1200px',
//   };
  
//   export const devices = {
//     xs: `(min-width: ${breakpoints.xs})`,
//     sm: `(min-width: ${breakpoints.sm})`,
//     md: `(min-width: ${breakpoints.md})`,
//     lg: `(min-width: ${breakpoints.lg})`,
//     xl: `(min-width: ${breakpoints.xl})`,
//     mobile: `(max-width: ${breakpoints.md})`,
//     tablet: `(min-width: ${breakpoints.md}) and (max-width: ${breakpoints.lg})`,
//     desktop: `(min-width: ${breakpoints.lg})`,
//   };
  
//   export default breakpoints;

  const mediaQueries = {
    width: {
        smallMobile: {
            max: "480px",
        },
        largeMobile: {
            max: "767px",
        },
        tablets: {
            min: "768px",
            max: "1024px",
        },
        laptops: {
            min: "1025px",
            max: "1280px",
        },
        desktops: {
            min: "1281px",
        },
    },
};
const screenSizes = {
  desktopsLarge: `(min-width: ${"1660px"})`,
  desktops: `(min-width: ${mediaQueries.width.desktops.min})`,
  laptops: `(max-width: ${mediaQueries.width.laptops.max})`,
  tablets: `(max-width: ${mediaQueries.width.tablets.max})`,
  mobileLarge: `(max-width: ${mediaQueries.width.largeMobile.max})`,
  mobileSmall: `(max-width: ${mediaQueries.width.smallMobile.max})`,
  mobileLargeLandscape: `(max-width: ${mediaQueries.width.largeMobile.max}) and (orientation:landscape)`,
}

export default screenSizes;